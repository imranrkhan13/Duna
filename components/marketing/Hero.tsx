"use client";

import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";

import { HeroVisualization } from "./HeroVisualization";
import { MotionDiv, Reveal } from "@/components/ui/Motion";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-gray-200 bg-[#FAFAFA] px-5 pb-20 pt-20 sm:px-6 lg:px-8">
      <div className="absolute left-1/2 top-12 -z-0 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute right-0 top-40 -z-0 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl text-center">
        <Reveal>
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Enterprise-grade AI assessment
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <h1 className="mx-auto mt-7 max-w-5xl text-5xl font-semibold tracking-[-0.065em] text-gray-950 sm:text-7xl lg:text-8xl">
            The new standard for AI pronunciation assessment.
          </h1>
        </Reveal>

        <Reveal delay={0.16}>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-gray-500 sm:text-lg">
            Measure pronunciation accuracy with deterministic, auditable scoring
            built for education, language learning, and assessment platforms.
          </p>
        </Reveal>

        <Reveal delay={0.24}>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <MotionDiv whileTap={{ scale: 0.98 }}>
              <Link
                className="inline-flex h-11 items-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-medium text-white shadow-[0_14px_34px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:bg-blue-500"
                href="#product"
              >
                Score Audio
                <ArrowRight className="h-4 w-4" />
              </Link>
            </MotionDiv>
            <MotionDiv whileTap={{ scale: 0.98 }}>
              <Link
                className="inline-flex h-11 items-center gap-2 rounded-full border border-gray-200 bg-white px-5 text-sm font-medium text-gray-950 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300"
                href="/demo"
              >
                <PlayCircle className="h-4 w-4 text-sky-500" />
                Live Demo
              </Link>
            </MotionDiv>
          </div>
        </Reveal>

        <HeroVisualization />
      </div>
    </section>
  );
}
