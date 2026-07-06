import type { ReactNode } from "react";

import { CheckCircle2 } from "lucide-react";

type StepCardProps = {
  step: number;
  title: string;
  description: string;
  complete?: boolean;
  children: ReactNode;
};

export function StepCard({
  step,
  title,
  description,
  complete = false,
  children,
}: StepCardProps) {
  return (
    <section className="rounded-[1.75rem] border border-gray-200 bg-white p-6 shadow-[0_18px_60px_rgba(17,24,39,0.04)]">
      <div className="mb-6 flex items-start gap-4">
        <div
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold ${
            complete
              ? "bg-blue-600 text-white"
              : "border border-gray-200 bg-[#FAFAFA] text-gray-600"
          }`}
        >
          {complete ? <CheckCircle2 className="h-4 w-4" /> : step}
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-gray-950">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
