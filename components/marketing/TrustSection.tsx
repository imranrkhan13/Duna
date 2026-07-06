"use client";

import { Reveal } from "@/components/ui/Motion";

const logos = ["Lexora", "Speakly", "Edvo", "Lingua", "TutorOS", "Auralab"];

export function TrustSection() {
  return (
    <section className="border-b border-gray-200 bg-white py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-center text-sm text-gray-500">
            Trusted by modern education platforms
          </p>
        </Reveal>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {logos.map((logo, index) => (
            <Reveal delay={index * 0.04} key={logo}>
              <div className="group grid h-20 place-items-center rounded-2xl border border-gray-200 bg-[#FAFAFA] text-sm font-semibold tracking-[-0.02em] text-gray-400 grayscale transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:text-blue-600 hover:grayscale-0">
                {logo}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
