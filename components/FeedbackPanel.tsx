import type { SegmentFeedback } from "@/lib/types";

type FeedbackPanelProps = {
  feedback: SegmentFeedback[];
};

const TYPE_LABELS: Record<SegmentFeedback["type"], string> = {
  correct: "Strong alignment",
  mispronounced: "Mispronounced word",
  unclear: "Unclear segment",
  missing: "Missing word",
  extra: "Extra word",
};

const SEVERITY_STYLES: Record<SegmentFeedback["severity"], string> = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-rose-100 text-rose-800",
};

export function FeedbackPanel({ feedback }: FeedbackPanelProps) {
  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
        Learner feedback
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-slate-950">
        What to improve
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Feedback is generated from deterministic word and phoneme alignment, not
        from an LLM.
      </p>

      <div className="mt-6 space-y-4">
        {feedback.map((item, index) => (
          <article
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            key={`${item.type}-${item.expected ?? item.actual}-${index}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-700 ring-1 ring-slate-200">
                {TYPE_LABELS[item.type]}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${SEVERITY_STYLES[item.severity]}`}
              >
                {item.severity}
              </span>
              {typeof item.start === "number" ? (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                  {formatTime(item.start)}
                  {typeof item.end === "number" ? `-${formatTime(item.end)}` : ""}
                </span>
              ) : null}
            </div>

            <p className="mt-3 text-base font-semibold text-slate-950">
              {item.message}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{item.tip}</p>
          </article>
        ))}
      </div>
    </aside>
  );
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}
