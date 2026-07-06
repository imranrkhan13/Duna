import type { SegmentFeedback } from "@/lib/types";
import { Clock3, MessageSquareText } from "lucide-react";

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
    <aside className="rounded-[1.75rem] border border-gray-200 bg-white p-6 shadow-[0_18px_60px_rgba(17,24,39,0.04)]">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-600">
          <MessageSquareText className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Learner feedback
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-gray-950">
            What to improve
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Timeline feedback generated from deterministic word and phoneme
            alignment, not from an LLM.
          </p>
        </div>
      </div>

      <div className="relative mt-8 space-y-5 before:absolute before:bottom-4 before:left-4 before:top-4 before:w-px before:bg-gray-200">
        {feedback.map((item, index) => (
          <article
            className="relative ml-9 rounded-2xl border border-gray-200 bg-[#FAFAFA] p-4"
            key={`${item.type}-${item.expected ?? item.actual}-${index}`}
          >
            <span className="absolute -left-[2.05rem] top-5 h-3 w-3 rounded-full border-2 border-white bg-blue-600 shadow" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700 ring-1 ring-gray-200">
                {TYPE_LABELS[item.type]}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${SEVERITY_STYLES[item.severity]}`}
              >
                {item.severity}
              </span>
              {typeof item.start === "number" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-500 ring-1 ring-gray-200">
                  <Clock3 className="h-3 w-3" />
                  {formatTime(item.start)}
                  {typeof item.end === "number" ? `-${formatTime(item.end)}` : ""}
                </span>
              ) : null}
            </div>

            <p className="mt-3 text-base font-semibold text-gray-950">
              {item.message}
            </p>
            <p className="mt-2 text-sm leading-6 text-gray-600">{item.tip}</p>
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
