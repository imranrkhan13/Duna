import type { AlignmentStatus, PronunciationResult } from "@/lib/types";
import { MetricCard } from "./assessment/MetricCard";

type ScoreDisplayProps = {
  result: PronunciationResult;
};

const STATUS_STYLES: Record<AlignmentStatus, string> = {
  correct: "border-emerald-200 bg-emerald-50 text-emerald-900",
  mispronounced: "border-amber-200 bg-amber-50 text-amber-950",
  unclear: "border-sky-200 bg-sky-50 text-sky-950",
  missing: "border-rose-200 bg-rose-50 text-rose-950",
  extra: "border-violet-200 bg-violet-50 text-violet-950",
};

export function ScoreDisplay({ result }: ScoreDisplayProps) {
  const verdict =
    result.overallScore >= 90
      ? "Excellent"
      : result.overallScore >= 75
        ? "Strong"
        : result.overallScore >= 60
          ? "Developing"
          : "Needs practice";
  const mistakes = result.wordScores.filter(
    (score) => score.status !== "correct",
  );

  return (
    <div className="rounded-[1.75rem] border border-gray-200 bg-white p-6 shadow-[0_18px_60px_rgba(17,24,39,0.04)]">
      <div className="rounded-[1.5rem] bg-gray-950 p-6 text-white">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
              Pronunciation report
            </p>
            <div className="mt-4 flex items-end gap-4">
              <span className="text-7xl font-semibold tracking-[-0.08em]">
                {result.overallScore}
              </span>
              <span className="pb-3 text-sm font-medium text-white/50">
                /100
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              {verdict}
            </p>
          </div>
          <div className="max-w-sm text-sm leading-6 text-white/55">
            Provider: {result.provider}. The score is deterministic and expires{" "}
            {new Date(result.expiresAt).toLocaleString()}.
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          helper="Phoneme-level similarity"
          label="Pronunciation"
          value={result.breakdown.phonemeMatchRate}
        />
        <MetricCard
          helper="Word alignment accuracy"
          label="Fluency"
          value={result.breakdown.wordAccuracy}
        />
        <MetricCard
          helper="Provider confidence"
          label="Confidence"
          value={result.breakdown.confidence}
        />
        <MetricCard
          helper="Consistent word flow"
          label="Pacing"
          value={Math.max(0, 1 - result.breakdown.wordErrorRate)}
        />
        <MetricCard
          helper="Stress proxy from alignment"
          label="Stress"
          value={result.breakdown.phonemeMatchRate * 0.92}
        />
        <MetricCard
          helper="Rhythm proxy from WER"
          label="Rhythm"
          value={Math.max(0, result.breakdown.wordAccuracy * 0.95)}
        />
      </div>

      <div className="mt-8 rounded-[1.5rem] border border-gray-200 bg-[#FAFAFA] p-5">
        <h3 className="text-lg font-semibold tracking-[-0.03em] text-gray-950">
          Word-by-word alignment
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Green words matched, amber words need pronunciation practice, blue
          words were unclear, red words were missing, and purple words were
          extra.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {result.wordScores.map((score, index) => (
            <span
              className={`rounded-2xl border px-3 py-2 text-sm font-semibold ${STATUS_STYLES[score.status]}`}
              key={`${score.expected ?? score.actual}-${index}`}
              title={score.tip}
            >
              {score.status === "extra" ? "+" : ""}
              {score.expected ?? score.actual}
              {score.actual &&
              score.expected &&
              score.actual.toLowerCase() !== score.expected.toLowerCase()
                ? ` -> ${score.actual}`
                : ""}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold tracking-[-0.03em] text-gray-950">
          Detected mistakes
        </h3>
        <div className="mt-4 grid gap-3">
          {(mistakes.length ? mistakes : result.wordScores.slice(0, 3)).map(
            (score, index) => (
              <article
                className="rounded-2xl border border-gray-200 bg-white p-4"
                key={`${score.expected ?? score.actual}-mistake-${index}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                      {score.status === "correct"
                        ? "Correct pronunciation"
                        : "Detected mistake"}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-950">
                      Expected: {score.expected ?? "—"} · Heard:{" "}
                      {score.actual ?? "—"}
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {score.status}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-gray-500">
                  Suggested pronunciation: {score.expectedPhonemes.join(" ")}
                </p>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {score.tip}
                </p>
              </article>
            ),
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <TextCard label="Expected text" text={result.expectedText} />
        <TextCard label="Transcript" text={result.transcript} />
      </div>
    </div>
  );
}

function TextCard({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-2xl bg-[#FAFAFA] p-4 ring-1 ring-gray-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-gray-600">{text}</p>
    </div>
  );
}
