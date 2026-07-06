"use client";

import { CONSENT_NOTICE } from "@/lib/privacy";

type ConsentBannerProps = {
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
};

export function ConsentBanner({
  accepted,
  onAcceptedChange,
}: ConsentBannerProps) {
  return (
    <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            DPDP consent
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            Temporary audio processing only
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-900">
            {CONSENT_NOTICE} If a cloud speech-to-text provider is configured,
            your audio is transmitted to that provider only to generate the
            transcript used for this score.
          </p>
        </div>

        <label className="flex min-w-fit cursor-pointer items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-medium shadow-sm ring-1 ring-emerald-200">
          <input
            checked={accepted}
            className="h-5 w-5 accent-emerald-600"
            type="checkbox"
            onChange={(event) => onAcceptedChange(event.target.checked)}
          />
          I consent
        </label>
      </div>
    </section>
  );
}
