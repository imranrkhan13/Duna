import type { AlignmentStatus, PronunciationResult } from "@/lib/types";

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
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Pronunciation score
          </p>
          <div className="mt-3 flex items-end gap-3">
            <span className="text-6xl font-bold tracking-tight text-slate-950">
              {result.overallScore}
            </span>
            <span className="pb-2 text-2xl font-semibold text-slate-500">
              /100
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Provider: {result.provider}. Result expires{" "}
            {new Date(result.expiresAt).toLocaleString()}.
          </p>
        </div>

        <div className="grid min-w-64 grid-cols-2 gap-3 text-sm">
          <Metric
            label="Phoneme match"
            value={result.breakdown.phonemeMatchRate}
          />
          <Metric label="Word accuracy" value={result.breakdown.wordAccuracy} />
          <Metric label="STT confidence" value={result.breakdown.confidence} />
          <Metric label="WER" value={result.breakdown.wordErrorRate} invert />
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-slate-950">
          Word-by-word alignment
        </h3>
        <p className="mt-1 text-sm text-slate-600">
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

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <TextCard label="Expected text" text={result.expectedText} />
        <TextCard label="Transcript" text={result.transcript} />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  invert = false,
}: {
  label: string;
  value: number;
  invert?: boolean;
}) {
  const displayValue = invert ? value : value * 100;

  return (
    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-slate-950">
        {invert ? displayValue.toFixed(2) : `${Math.round(displayValue)}%`}
      </p>
    </div>
  );
}

function TextCard({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{text}</p>
    </div>
  );
}
