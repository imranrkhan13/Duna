import { HoverLift, Reveal } from "@/components/ui/Motion";

const stats = [
  {
    value: "10.6x",
    label: "Faster scoring",
    detail: "Instant pronunciation reports after STT completes.",
  },
  {
    value: "37%",
    label: "More actionable learner feedback",
    detail: "Word-level mistakes, timestamps, and practical correction tips.",
  },
  {
    value: "4.8x",
    label: "Auditable assessments",
    detail: "Deterministic math instead of opaque generated scoring.",
  },
];

export function StatsGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat, index) => (
        <Reveal delay={index * 0.08} key={stat.label}>
          <HoverLift className="h-full">
            <article className="h-full rounded-[1.75rem] border border-gray-200 bg-white p-7 shadow-[0_18px_60px_rgba(17,24,39,0.04)]">
              <p className="text-5xl font-semibold tracking-[-0.06em] text-gray-950">
                {stat.value}
              </p>
              <div className="my-6 h-px bg-gray-200" />
              <h3 className="text-base font-semibold text-gray-950">
                {stat.label}
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                {stat.detail}
              </p>
            </article>
          </HoverLift>
        </Reveal>
      ))}
    </div>
  );
}
