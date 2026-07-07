"use client";

import { motion } from "framer-motion";
import { Mic, Square } from "lucide-react";

type RecorderProps = {
  state: "idle" | "recording" | "processing";
  seconds: number;
  level: number;
  recordedAudioUrl?: string | null;
  isScoring?: boolean;
  onStart: () => void;
  onStop: () => void;
  onDelete: () => void;
};

export function Recorder({
  state,
  seconds,
  level,
  recordedAudioUrl,
  isScoring = false,
  onStart,
  onStop,
  onDelete,
}: RecorderProps) {
  const isRecording = state === "recording";

  return (
    <div className="rounded-[1.5rem] border border-gray-200 bg-[#FAFAFA] p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
            {isRecording ? (
              <motion.span
                animate={{ opacity: [0.35, 0.12, 0.35], scale: [1, 1.6, 1] }}
                className="absolute inset-0 rounded-2xl bg-blue-500"
                transition={{ duration: 1.4, repeat: Infinity }}
              />
            ) : null}
            <Mic className="relative h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-950">
              {isRecording ? "Listening now" : "Record in browser"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Speak naturally. Stop recording and DUNA scores it automatically.
            </p>
          </div>
        </div>

        {isRecording ? (
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gray-950 px-5 text-sm font-medium text-white transition hover:-translate-y-0.5"
            type="button"
            onClick={onStop}
          >
            <Square className="h-4 w-4 fill-white" />
            Stop {formatTimer(seconds)}
          </button>
        ) : (
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-medium text-white shadow-[0_12px_30px_rgba(37,99,235,0.2)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:bg-gray-300"
            disabled={state === "processing" || isScoring}
            type="button"
            onClick={onStart}
          >
            <Mic className="h-4 w-4" />
            {state === "processing" || isScoring ? "Processing" : "Start speaking"}
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_12rem]">
        <div className="flex h-24 items-center gap-1 rounded-2xl border border-gray-200 bg-white px-4">
          {Array.from({ length: 36 }).map((_, index) => (
            <motion.span
              animate={
                isRecording
                  ? {
                      height: [
                        `${12 + (index % 4) * 6}px`,
                        `${30 + (index % 7) * 4}px`,
                        `${12 + (index % 4) * 6}px`,
                      ],
                    }
                  : { height: `${10 + (index % 5) * 3}px` }
              }
              className="w-1.5 rounded-full bg-gradient-to-t from-blue-600 to-sky-400"
              key={index}
              transition={{
                duration: 1,
                delay: index * 0.025,
                repeat: isRecording ? Infinity : 0,
              }}
            />
          ))}
        </div>

        <div className="grid gap-3">
          <Telemetry label="Timer" value={formatTimer(seconds)} />
          <Telemetry
            label="Noise level"
            value={isRecording ? `${Math.round(level * 100)}%` : "Standby"}
          />
        </div>
      </div>

      {recordedAudioUrl ? (
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-950">
                Recorded audio ready
              </p>
              <p className="mt-1 text-xs text-gray-500">
              Attached automatically. Scoring starts as soon as recording stops.
              </p>
            </div>
            <button
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-rose-200 hover:text-rose-600"
              type="button"
              onClick={onDelete}
            >
              Delete & Record Again
            </button>
          </div>
          <audio
            className="mt-4 w-full"
            controls
            preload="metadata"
            src={recordedAudioUrl}
          >
            Your browser does not support audio playback.
          </audio>
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
          Real-time transcript
        </p>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          {isRecording
            ? "Capturing audio locally. Transcript appears after secure STT processing."
            : "Start recording to generate a transcript and pronunciation report."}
        </p>
      </div>
    </div>
  );
}

function Telemetry({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-950">{value}</p>
    </div>
  );
}

function formatTimer(seconds: number) {
  return `0:${seconds.toString().padStart(2, "0")}`;
}
