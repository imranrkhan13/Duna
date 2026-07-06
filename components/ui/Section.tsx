import type { ReactNode } from "react";

type SectionProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  id?: string;
};

export function Section({
  eyebrow,
  title,
  description,
  children,
  className = "",
  id,
}: SectionProps) {
  return (
    <section className={`mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8 ${className}`} id={id}>
      {(eyebrow || title || description) ? (
        <div className="mx-auto mb-12 max-w-3xl text-center">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
              {eyebrow}
            </p>
          ) : null}
          {title ? (
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-gray-950 sm:text-5xl">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="mt-4 text-sm leading-7 text-gray-500 sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
