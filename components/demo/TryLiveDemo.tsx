"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AudioLines,
  CheckCircle2,
  FileAudio,
  FileText,
  MessageSquareText,
  Play,
  Route,
  Sparkles,
  Timer,
} from "lucide-react";

import { FeedbackPanel } from "@/components/FeedbackPanel";
import { ScoreDisplay } from "@/components/ScoreDisplay";
import { bundledDemos, type BundledDemo } from "@/lib/bundledDemos";

const stages = [
  { label: "Upload", icon: FileAudio },
  { label: "Speech Recognition", icon: AudioLines },
  { label: "Transcript", icon: FileText },
  { label: "Phoneme Alignment", icon: Route },
  { label: "Scoring", icon: Sparkles },
  { label: "Feedback", icon: MessageSquareText },
  { label: "Assessment Report", icon: CheckCircle2 },
];

export function TryLiveDemo() {
  const [selectedId, setSelectedId] = useState(bundledDemos[0]?.id ?? "");
  const [activeStage, setActiveStage] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const reduceMotion = useReducedMotion();
  const selectedDemo = useMemo(
    () => bundledDemos.find((demo) => demo.id === selectedId) ?? bundledDemos[0],
    [selectedId],
  );

  useEffect(
    () => () => {
      audioRef.current?.pause();
    },
    [],
  );

  function runDemo(demo: BundledDemo = selectedDemo) {
    if (!demo) {
      return;
    }

    setSelectedId(demo.id);
    setIsRunning(true);
    setShowReport(false);
    setActiveStage(-1);

    const audio = audioRef.current;
    if (audio) {
      audio.src = demo.audioPath;
      audio.currentTime = 0;
      void audio.play().catch(() => undefined);
    }

    stages.forEach((_, index) => {
      window.setTimeout(
        () => {
          setActiveStage(index);
          if (index === stages.length - 1) {
            window.setTimeout(() => {
              setShowReport(true);
              setIsRunning(false);
            }, reduceMotion ? 80 : 450);
          }
        },
        reduceMotion ? index * 80 : 450 + index * 620,
      );
    });
  }

  if (!selectedDemo) {
    return null;
  }

  return (
    <section
      className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
      id="live-demo"
    >
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
          Try live demo
        </p>
        <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.045em] text-gray-950 sm:text-5xl lg:text-6xl">
          Understand DUNA in under 30 seconds.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-gray-500 sm:text-base sm:leading-8">
          Pick a bundled recording, run the pipeline, hear the audio, and see a
          complete pronunciation report without uploading anything.
        </p>
      </div>

      <div className="mt-8 grid gap-5 sm:mt-10 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="grid gap-3 sm:grid-cols-2 lg:block lg:space-y-3">
          {bundledDemos.map((demo) => (
            <button
              className={`w-full rounded-3xl border p-4 text-left transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                selectedDemo.id === demo.id
                  ? "border-blue-300 bg-blue-50"
                  : "border-gray-200 bg-white hover:-translate-y-0.5 hover:border-blue-200"
              }`}
              key={demo.id}
              type="button"
              onClick={() => {
                setSelectedId(demo.id);
                setShowReport(false);
                setActiveStage(-1);
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-950">
                    {demo.quality}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">{demo.label}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                  {demo.score}
                </span>
              </div>
              <p className="mt-3 text-xs leading-5 text-gray-500">
                {demo.summary}
              </p>
            </button>
          ))}
        </div>

        <div className="rounded-[1.5rem] border border-gray-200 bg-white p-4 shadow-[0_24px_80px_rgba(17,24,39,0.06)] sm:rounded-[2rem] sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-950">
                {selectedDemo.label}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Expected: {selectedDemo.result.expectedText}
              </p>
            </div>
            <button
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-medium text-white shadow-[0_14px_34px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-wait disabled:bg-gray-300 sm:w-auto"
              disabled={isRunning}
              type="button"
              onClick={() => runDemo()}
            >
              <Play className="h-4 w-4 fill-white" />
              {isRunning ? "Running pipeline..." : "Run Demo"}
            </button>
          </div>

          <audio
            className="mt-5 w-full"
            controls
            preload="metadata"
            ref={audioRef}
            src={selectedDemo.audioPath}
          >
            Your browser does not support audio playback.
          </audio>

          <div className="mt-5 overflow-hidden rounded-3xl border border-gray-200 bg-[#FAFAFA] p-4">
            <div className="flex h-24 items-center gap-1 overflow-hidden rounded-2xl bg-white px-4 ring-1 ring-gray-100">
              {Array.from({ length: 44 }).map((_, index) => (
                <motion.span
                  animate={
                    isRunning && !reduceMotion
                      ? {
                          height: [
                            `${14 + (index % 5) * 5}px`,
                            `${34 + (index % 8) * 4}px`,
                            `${14 + (index % 5) * 5}px`,
                          ],
                        }
                      : { height: `${12 + (index % 6) * 4}px` }
                  }
                  className="w-1.5 shrink-0 rounded-full bg-gradient-to-t from-blue-600 to-sky-400"
                  key={index}
                  transition={{
                    duration: 1,
                    delay: index * 0.02,
                    repeat: isRunning && !reduceMotion ? Infinity : 0,
                  }}
                />
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {stages.map((stage, index) => {
                const Icon = stage.icon;
                const done = activeStage >= index;
                const current = activeStage === index && isRunning;
                return (
                  <div
                    className={`rounded-2xl border p-3 transition ${
                      done
                        ? "border-blue-200 bg-white"
                        : "border-gray-200 bg-white/60"
                    }`}
                    key={stage.label}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`grid h-8 w-8 place-items-center rounded-xl ${
                          done
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {done && !current ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </span>
                      <p className="text-xs font-semibold text-gray-950">
                        {stage.label}
                      </p>
                    </div>
                    <div className="mt-3 h-1.5 rounded-full bg-gray-100">
                      <motion.div
                        animate={{ width: done ? "100%" : "0%" }}
                        className="h-full rounded-full bg-blue-600"
                        transition={{ duration: reduceMotion ? 0 : 0.4 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {!showReport ? (
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
              <Timer className="h-4 w-4 text-blue-600" />
              Click Run Demo to animate the complete assessment pipeline.
            </div>
          ) : null}
        </div>
      </div>

      {showReport ? (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
          transition={{ duration: reduceMotion ? 0 : 0.5 }}
        >
          <ScoreDisplay result={selectedDemo.result} />
          <FeedbackPanel feedback={selectedDemo.result.feedback} />
        </motion.div>
      ) : null}
    </section>
  );
}
