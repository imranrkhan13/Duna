"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  DemoStatus,
  DemoTestResult,
  DemoVerificationResponse,
} from "@/lib/demoTypes";

const STATUS_STYLES: Record<DemoStatus, string> = {
  pass: "border-emerald-200 bg-emerald-50 text-emerald-900",
  fail: "border-rose-200 bg-rose-50 text-rose-900",
  skipped: "border-amber-200 bg-amber-50 text-amber-900",
};

const STATUS_ICON: Record<DemoStatus, string> = {
  pass: "✓",
  fail: "×",
  skipped: "!",
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
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-stone-200 bg-white/85 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-500">
              Live API verification
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
              Demo proves the stack with real calls
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
              This page hits provider APIs and the production upload endpoint.
              Missing keys are shown explicitly; successful cards include real
              response payloads and latency.
            </p>
          </div>

          <button
            className="rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800 disabled:cursor-wait disabled:bg-stone-400"
            disabled={isLoading}
            type="button"
            onClick={() => void runDemo()}
          >
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

      {report ? (
        <section className="rounded-[2rem] border border-stone-200 bg-white/80 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-950">
            Environment keys
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {report.apiKeys.map((key) => (
              <div
                className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                key={key.label}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-stone-950">{key.label}</p>
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
                <p className="mt-2 text-xs leading-5 text-stone-500">
                  {key.names.join(" or ")}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-900">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4">
        {report?.tests.map((test) => (
          <DemoCard key={test.id} test={test} />
        ))}
        {isLoading && !report ? (
          <div className="rounded-[2rem] border border-stone-200 bg-white/80 p-8 text-stone-600 shadow-sm">
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
  return (
    <details className="group rounded-[2rem] border border-stone-200 bg-white/85 p-5 shadow-sm open:bg-white">
      <summary className="flex cursor-pointer list-none flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-xl font-bold ${STATUS_STYLES[test.status]}`}
          >
            {STATUS_ICON[test.status]}
          </span>
          <div>
            <h3 className="text-xl font-semibold text-stone-950">
              {test.title}
            </h3>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              {test.summary}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="rounded-full bg-stone-100 px-3 py-1 font-semibold text-stone-700">
            {test.latencyMs}ms
          </span>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${STATUS_STYLES[test.status]}`}
          >
            {test.status}
          </span>
        </div>
      </summary>

      <div className="mt-5 border-t border-stone-100 pt-5">
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

        <pre className="max-h-[36rem] overflow-auto rounded-2xl bg-stone-950 p-4 text-xs leading-5 text-stone-100">
          {JSON.stringify(test.details, null, 2)}
        </pre>
      </div>
    </details>
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
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-stone-950">{value}</p>
    </div>
  );
}
