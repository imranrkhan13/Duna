"use client";

import { CONSENT_NOTICE } from "@/lib/privacy";
import { ShieldCheck } from "lucide-react";

type ConsentBannerProps = {
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
};

export function ConsentBanner({
  accepted,
  onAcceptedChange,
}: ConsentBannerProps) {
  return (
    <section className="rounded-[1.5rem] border border-gray-200 bg-[#FAFAFA] p-5">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm ring-1 ring-gray-200">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            DPDP consent
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-gray-950">
            Temporary audio processing only
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
            {CONSENT_NOTICE} If a cloud speech-to-text provider is configured,
            your audio is transmitted to that provider only to generate the
            transcript used for this score. Consent is required before the
            microphone can start recording.
          </p>
          </div>
        </div>

        <label className="flex min-w-fit cursor-pointer items-center gap-3 rounded-full bg-white px-4 py-3 text-sm font-medium text-gray-950 shadow-sm ring-1 ring-gray-200 transition hover:ring-blue-200">
          <input
            checked={accepted}
            className="h-5 w-5 accent-blue-600"
            type="checkbox"
            onChange={(event) => onAcceptedChange(event.target.checked)}
          />
          I consent
        </label>
      </div>
    </section>
  );
}
