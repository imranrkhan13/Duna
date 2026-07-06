"use client";

import { useCallback, useMemo, useState } from "react";

import { ConsentBanner } from "./ConsentBanner";
import { FeedbackPanel } from "./FeedbackPanel";
import { ScoreDisplay } from "./ScoreDisplay";
import type { PronunciationResult, UploadError } from "@/lib/types";

const MIN_DURATION_SECONDS = 30;
const MAX_DURATION_SECONDS = 45;
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

const SAMPLE_PASSAGE =
  "The quick brown fox jumps over the lazy dog while the careful speaker practices clear English pronunciation with steady rhythm and confident volume.";

export function AudioUploader() {
  const [accepted, setAccepted] = useState(false);
  const [expectedText, setExpectedText] = useState(SAMPLE_PASSAGE);
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<PronunciationResult | null>(null);

  const wordCount = useMemo(
    () => expectedText.trim().split(/\s+/).filter(Boolean).length,
    [expectedText],
  );

  const handleFile = useCallback(async (nextFile: File | undefined) => {
    setError(null);
    setResult(null);

    if (!nextFile) {
      return;
    }

    if (!nextFile.type.startsWith("audio/")) {
      setFile(null);
      setDuration(null);
      setError("Choose a browser-playable audio file.");
      return;
    }

    if (nextFile.size > MAX_AUDIO_BYTES) {
      setFile(null);
      setDuration(null);
      setError("Audio files must be 25 MB or smaller.");
      return;
    }

    try {
      const nextDuration = await readBrowserAudioDuration(nextFile);
      if (
        nextDuration < MIN_DURATION_SECONDS ||
        nextDuration > MAX_DURATION_SECONDS
      ) {
        setFile(null);
        setDuration(nextDuration);
        setError(
          `Audio must be between ${MIN_DURATION_SECONDS} and ${MAX_DURATION_SECONDS} seconds. This file is ${nextDuration.toFixed(1)} seconds.`,
        );
        return;
      }

      setFile(nextFile);
      setDuration(nextDuration);
    } catch (durationError) {
      setFile(null);
      setDuration(null);
      setError(
        durationError instanceof Error
          ? durationError.message
          : "Could not read audio duration.",
      );
    }
  }, []);

  async function submit() {
    setError(null);
    setResult(null);

    if (!accepted) {
      setError("Please accept the DPDP consent notice before upload.");
      return;
    }

    if (wordCount < 5) {
      setError("Add the expected English passage before upload.");
      return;
    }

    if (!file) {
      setError("Choose a 30-45 second English speech audio file.");
      return;
    }

    const formData = new FormData();
    formData.append("consent", "true");
    formData.append("expectedText", expectedText);
    formData.append("audio", file);

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as
        | PronunciationResult
        | UploadError;

      if (!response.ok) {
        const uploadError = payload as UploadError;
        throw new Error(
          uploadError.detail
            ? `${uploadError.error} ${uploadError.detail}`
            : uploadError.error,
        );
      }

      setResult(payload as PronunciationResult);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Upload failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <ConsentBanner accepted={accepted} onAcceptedChange={setAccepted} />

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
              Expected passage
            </p>
            <label className="text-2xl font-semibold text-slate-950">
              Text the learner should read
            </label>
            <p className="text-sm text-slate-600">
              Paste the prompt used for the recording. Scores are computed by
              comparing this text with the STT transcript.
            </p>
          </div>
          <textarea
            className="mt-5 min-h-44 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-base leading-7 text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            value={expectedText}
            onChange={(event) => setExpectedText(event.target.value)}
          />
          <p className="mt-3 text-sm text-slate-500">
            {wordCount} words. Use a passage that naturally takes 30-45 seconds
            to read.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
              Audio upload
            </p>
            <h2 className="text-2xl font-semibold text-slate-950">
              30-45 seconds, English speech
            </h2>
            <p className="text-sm text-slate-600">
              Supports common browser audio formats such as MP3, WAV, M4A, OGG,
              and WebM.
            </p>
          </div>

          <label
            className={`mt-5 flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-6 text-center transition ${
              isDragging
                ? "border-indigo-500 bg-indigo-50"
                : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50"
            }`}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              void handleFile(event.dataTransfer.files[0]);
            }}
          >
            <input
              accept="audio/*"
              className="sr-only"
              type="file"
              onChange={(event) => void handleFile(event.target.files?.[0])}
            />
            <span className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">
              Drag and drop or browse
            </span>
            <span className="mt-4 text-lg font-semibold text-slate-900">
              {file ? file.name : "Choose an audio file"}
            </span>
            <span className="mt-2 text-sm text-slate-500">
              {duration
                ? `${duration.toFixed(1)} seconds detected`
                : "Duration is checked before upload"}
            </span>
          </label>

          <button
            className="mt-5 w-full rounded-2xl bg-indigo-600 px-5 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={isSubmitting}
            type="button"
            onClick={() => void submit()}
          >
            {isSubmitting ? "Scoring pronunciation..." : "Score pronunciation"}
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-900">
          {error}
        </div>
      ) : null}

      {result ? (
        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <ScoreDisplay result={result} />
          <FeedbackPanel feedback={result.feedback} />
        </section>
      ) : null}
    </div>
  );
}

function readBrowserAudioDuration(file: File) {
  return new Promise<number>((resolve, reject) => {
    const audio = document.createElement("audio");
    const objectUrl = URL.createObjectURL(file);

    audio.preload = "metadata";
    audio.src = objectUrl;

    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
        reject(new Error("Could not read audio duration from this file."));
        return;
      }

      resolve(audio.duration);
    };

    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Use a standard browser-playable audio file."));
    };
  });
}
