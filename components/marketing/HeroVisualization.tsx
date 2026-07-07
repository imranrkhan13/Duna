"use client";

import { motion } from "framer-motion";
import {
  AudioLines,
  BrainCircuit,
  CheckCircle2,
  FileText,
  MessageSquareText,
  Route,
} from "lucide-react";

const flow = [
  { label: "Audio waveform", icon: AudioLines, color: "text-blue-600" },
  { label: "Speech to text", icon: FileText, color: "text-sky-600" },
  { label: "Phoneme alignment", icon: Route, color: "text-indigo-600" },
  { label: "Pronunciation score", icon: BrainCircuit, color: "text-blue-600" },
  { label: "Learner feedback", icon: MessageSquareText, color: "text-sky-600" },
];

export function HeroVisualization() {
  return (
    <div className="relative mx-auto mt-12 max-w-5xl">
      <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-r from-blue-500/10 via-sky-400/10 to-blue-500/10 blur-3xl" />
      <motion.div
        animate={{ y: [0, -6, 0] }}
        className="overflow-hidden rounded-[1.5rem] border border-gray-200 bg-white/90 p-3 shadow-[0_24px_80px_rgba(17,24,39,0.08)] backdrop-blur sm:rounded-[2rem] sm:p-5"
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-gray-100 bg-[#FAFAFA] p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-gray-950">
                Live pronunciation pipeline
              </p>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                deterministic
              </span>
            </div>

            <div className="mt-6 flex h-24 items-center gap-1 overflow-hidden rounded-2xl bg-white px-3 ring-1 ring-gray-100 sm:h-28 sm:px-4">
              {Array.from({ length: 34 }).map((_, index) => (
                <motion.span
                  animate={{ height: [`${18 + (index % 6) * 7}px`, `${36 + (index % 8) * 5}px`, `${18 + (index % 6) * 7}px`] }}
                  className="w-1.5 rounded-full bg-gradient-to-t from-blue-600 to-sky-400"
                  key={index}
                  transition={{
                    duration: 1.2,
                    delay: index * 0.035,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {flow.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    className="relative rounded-2xl border border-gray-100 bg-white p-3"
                    initial={{ opacity: 0, y: 12 }}
                    key={item.label}
                    transition={{ delay: 0.2 + index * 0.12, duration: 0.45 }}
                    whileInView={{ opacity: 1, y: 0 }}
                  >
                    <Icon className={`h-5 w-5 ${item.color}`} />
                    <p className="mt-3 text-xs font-medium leading-4 text-gray-700">
                      {item.label}
                    </p>
                    {index < flow.length - 1 ? (
                      <span className="absolute -right-3 top-1/2 hidden h-px w-6 bg-gradient-to-r from-blue-200 to-transparent sm:block" />
                    ) : null}
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl bg-gray-950 p-5 text-white">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white/90">
                Assessment report
              </p>
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="mt-6">
              <p className="text-5xl font-semibold tracking-[-0.06em] sm:text-6xl">92</p>
              <p className="mt-1 text-sm text-white/55">Excellent clarity</p>
            </div>
            <div className="mt-7 space-y-3">
              {["Pronunciation", "Fluency", "Rhythm"].map((label, index) => (
                <div key={label}>
                  <div className="flex justify-between text-xs text-white/60">
                    <span>{label}</span>
                    <span>{[94, 89, 91][index]}%</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-blue-400 to-sky-300"
                      initial={{ width: 0 }}
                      transition={{ delay: 0.45 + index * 0.15, duration: 0.9 }}
                      whileInView={{ width: `${[94, 89, 91][index]}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
