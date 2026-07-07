"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  KeyRound,
  Loader2,
  Mic2,
  Volume2,
  XCircle,
} from "lucide-react";

import { MotionDiv, Reveal } from "@/components/ui/Motion";
import type {
  DemoStatus,
  DemoTestResult,
  DemoVerificationResponse,
} from "@/lib/demoTypes";

const STATUS_STYLES: Record<DemoStatus, string> = {
  pass: "border-emerald-200 bg-emerald-50 text-emerald-700",
  fail: "border-rose-200 bg-rose-50 text-rose-700",
  skipped: "border-amber-200 bg-amber-50 text-amber-700",
};

const STATUS_ICON = {
  pass: CheckCircle2,
  fail: XCircle,
  skipped: AlertTriangle,
};

export function DemoRunner() {
  const [report, setReport] = useState<DemoVerificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDemo = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/demo/verify", {
        cache: "no-store",
      });
      const payload = (await response.json()) as DemoVerificationResponse;

      if (!response.ok) {
        throw new Error(JSON.stringify(payload));
      }

      setReport(payload);
    } catch (demoError) {
      setError(
        demoError instanceof Error
          ? demoError.message
          : "Demo verification failed.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void runDemo();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [runDemo]);

  const issues = useMemo(
    () =>
      report?.tests.flatMap((test) =>
        test.issues.map((issue) => `${test.title}: ${issue}`),
      ) ?? [],
    [report],
  );

  return (
    <div className="space-y-6">
      <Reveal>
      <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-[0_18px_70px_rgba(17,24,39,0.05)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
              Live API verification
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-gray-950 sm:text-5xl">
              Demo proves the stack with real calls
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-500 sm:text-base">
              This page hits provider APIs and the production upload endpoint.
              Missing keys are shown explicitly; successful cards include real
              response payloads and latency.
            </p>
          </div>

          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-medium text-white shadow-[0_14px_34px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-wait disabled:bg-gray-300"
            disabled={isLoading}
            type="button"
            onClick={() => void runDemo()}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isLoading ? "Running live tests..." : "Run live verification"}
          </button>
        </div>

        {report ? (
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <SummaryMetric
              label="Passing"
              value={`${report.summary.passing}/${report.summary.total}`}
            />
            <SummaryMetric label="Failing" value={report.summary.failing} />
            <SummaryMetric label="Skipped" value={report.summary.skipped} />
            <SummaryMetric
              label="Generated"
              value={new Date(report.generatedAt).toLocaleTimeString()}
            />
          </div>
        ) : null}
      </section>
      </Reveal>

      {report ? (
        <Reveal delay={0.05}>
        <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-[0_18px_70px_rgba(17,24,39,0.04)]">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-50 text-sky-600">
                  <Volume2 className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.03em] text-gray-950">
                    Built-in voice sample
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Listen to the exact audio sent to each configured STT API.
                  </p>
                </div>
              </div>

              <audio
                className="mt-5 w-full"
                controls
                preload="metadata"
                src={report.demoAssets.primaryAudio.path}
              >
                Your browser does not support audio playback.
              </audio>

              <p className="mt-4 rounded-2xl border border-gray-200 bg-[#FAFAFA] p-4 text-sm leading-6 text-gray-500">
                {report.demoAssets.primaryAudio.purpose}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <PhraseCard
                label="Expected passage"
                text={report.demoAssets.primaryAudio.expectedPassage}
              />
              <PhraseCard
                label="Spoken in fixture"
                text={report.demoAssets.primaryAudio.spokenPhrase}
                tone="warning"
              />
            </div>
          </div>
        </section>
        </Reveal>
      ) : null}

      {report ? (
        <Reveal delay={0.08}>
        <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-[0_18px_70px_rgba(17,24,39,0.04)]">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <Mic2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-gray-950">
                Provider transcripts
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Every configured API receives the same built-in voice sample.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {report.tests
              .filter((test) =>
                ["gradium-stt", "groq-whisper", "deepgram"].includes(test.id),
              )
              .map((test) => (
                <ProviderResult key={test.id} test={test} />
              ))}
          </div>
        </section>
        </Reveal>
      ) : null}

      {report ? (
        <Reveal delay={0.11}>
        <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-[0_18px_70px_rgba(17,24,39,0.04)]">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <KeyRound className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-gray-950">
              Environment keys
            </h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {report.apiKeys.map((key) => (
              <div
                className="rounded-2xl border border-gray-200 bg-[#FAFAFA] p-4"
                key={key.label}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-gray-950">{key.label}</p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      key.configured
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {key.configured ? "Configured" : "Missing"}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-gray-500">
                  {key.names.join(" or ")}
                </p>
              </div>
            ))}
          </div>
        </section>
        </Reveal>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-900">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4">
        {report?.tests.map((test, index) => (
          <Reveal delay={index * 0.04} key={test.id}>
            <DemoCard test={test} />
          </Reveal>
        ))}
        {isLoading && !report ? (
          <div className="rounded-[2rem] border border-gray-200 bg-white p-8 text-gray-500 shadow-sm">
            Running real API checks. This can take a moment because provider
            calls and upload validation are executed live.
          </div>
        ) : null}
      </section>

      {report ? (
        <section
          className={`rounded-[2rem] border p-6 shadow-sm ${
            issues.length === 0
              ? "border-emerald-200 bg-emerald-50 text-emerald-950"
              : "border-amber-200 bg-amber-50 text-amber-950"
          }`}
        >
          <h2 className="text-2xl font-semibold">{report.finalMessage}</h2>
          {issues.length > 0 ? (
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6">
              {issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm">
              All cards returned live success responses from the configured
              providers and app endpoints.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}

function DemoCard({ test }: { test: DemoTestResult }) {
  const Icon = STATUS_ICON[test.status];

  return (
    <details className="group rounded-[2rem] border border-gray-200 bg-white p-5 shadow-[0_18px_70px_rgba(17,24,39,0.04)] open:bg-white">
      <summary className="flex cursor-pointer list-none flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${STATUS_STYLES[test.status]}`}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-xl font-semibold tracking-[-0.03em] text-gray-950">
              {test.title}
            </h3>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              {test.summary}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-600">
            <Clock3 className="h-3 w-3" />
            {test.latencyMs}ms
          </span>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${STATUS_STYLES[test.status]}`}
          >
            {test.status}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-400 transition group-open:rotate-180" />
        </div>
      </summary>

      <MotionDiv
        className="mt-5 border-t border-gray-100 pt-5"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
      >
        {test.issues.length > 0 ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-semibold">Issues</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {test.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <pre className="max-h-[36rem] overflow-auto rounded-2xl bg-gray-950 p-4 text-xs leading-5 text-gray-100">
          {JSON.stringify(test.details, null, 2)}
        </pre>
      </MotionDiv>
    </details>
  );
}

function PhraseCard({
  label,
  text,
  tone = "neutral",
}: {
  label: string;
  text: string;
  tone?: "neutral" | "warning";
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        tone === "warning"
          ? "border-amber-200 bg-amber-50"
          : "border-gray-200 bg-[#FAFAFA]"
      }`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-[0.16em] ${
          tone === "warning" ? "text-amber-600" : "text-gray-400"
        }`}
      >
        {label}
      </p>
      <p className="mt-3 text-base font-semibold leading-7 tracking-[-0.02em] text-gray-950">
        {text}
      </p>
    </div>
  );
}

function ProviderResult({ test }: { test: DemoTestResult }) {
  const details = test.details as {
    transcript?: string;
    attempts?: Array<{ result?: { text?: string }; provider?: string }>;
    reason?: string;
  };
  const transcript =
    details.transcript ??
    details.attempts?.find((attempt) => attempt.result?.text)?.result?.text ??
    details.reason ??
    "No transcript returned.";

  return (
    <article className="rounded-2xl border border-gray-200 bg-[#FAFAFA] p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-950">{test.title}</h3>
        <span
          className={`rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-wide ${STATUS_STYLES[test.status]}`}
        >
          {test.status}
        </span>
      </div>
      <p className="mt-3 line-clamp-4 text-sm leading-6 text-gray-600">
        {transcript}
      </p>
      <p className="mt-4 text-xs font-medium text-gray-400">
        Latency: {test.latencyMs}ms
      </p>
    </article>
  );
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-[#FAFAFA] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-gray-950">{value}</p>
    </div>
  );
}
