"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  const [recordingState, setRecordingState] = useState<
    "idle" | "recording" | "processing"
  >("idle");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  function clearRecordingTimers() {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
  }

  useEffect(
    () => () => {
      clearRecordingTimers();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  async function startRecording() {
    setError(null);
    setResult(null);

    if (!accepted) {
      setError("Please accept the DPDP consent notice before recording.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("Your browser does not support in-page audio recording.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      streamRef.current = stream;
      recorderRef.current = recorder;
      recordingChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(recordingChunksRef.current, { type: mimeType });
        const recordedFile = new File([blob], `recording-${Date.now()}.webm`, {
          type: mimeType,
        });

        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        setRecordingState("idle");
        void handleFile(recordedFile);
      };

      recorder.start();
      setRecordingSeconds(0);
      setRecordingState("recording");
      clearRecordingTimers();
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((seconds) =>
          Math.min(seconds + 1, MAX_DURATION_SECONDS),
        );
      }, 1000);
      autoStopTimerRef.current = setTimeout(() => {
        stopRecording();
      }, MAX_DURATION_SECONDS * 1000);
    } catch (recordingError) {
      setRecordingState("idle");
      setError(
        recordingError instanceof Error
          ? recordingError.message
          : "Could not start microphone recording.",
      );
    }
  }

  function stopRecording() {
    clearRecordingTimers();
    const recorder = recorderRef.current;

    if (recorder && recorder.state === "recording") {
      setRecordingState("processing");
      recorder.stop();
    }
  }

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
        <div className="rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-sm">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
              Expected passage
            </p>
            <label className="text-2xl font-semibold text-stone-950">
              Text the learner should read
            </label>
            <p className="text-sm text-stone-600">
              Paste the prompt used for the recording. Scores are computed by
              comparing this text with the STT transcript.
            </p>
          </div>
          <textarea
            className="mt-5 min-h-44 w-full rounded-2xl border border-stone-200 bg-stone-50 p-4 text-base leading-7 text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white focus:ring-4 focus:ring-stone-100"
            value={expectedText}
            onChange={(event) => setExpectedText(event.target.value)}
          />
          <p className="mt-3 text-sm text-stone-500">
            {wordCount} words. Use a passage that naturally takes 30-45 seconds
            to read.
          </p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-sm">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
              Audio upload or recording
            </p>
            <h2 className="text-2xl font-semibold text-stone-950">
              30-45 seconds, English speech
            </h2>
            <p className="text-sm text-stone-600">
              Supports common browser audio formats such as MP3, WAV, M4A, OGG,
              and WebM.
            </p>
          </div>

          <div className="mt-5 rounded-3xl border border-stone-200 bg-stone-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-stone-950">Record yourself</p>
                <p className="text-sm text-stone-600">
                  Speak for 30-45 seconds. Recording auto-stops at 45 seconds.
                </p>
              </div>
              {recordingState === "recording" ? (
                <button
                  className="rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white"
                  type="button"
                  onClick={stopRecording}
                >
                  Stop {recordingSeconds}s
                </button>
              ) : (
                <button
                  className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white disabled:bg-stone-400"
                  disabled={recordingState === "processing"}
                  type="button"
                  onClick={() => void startRecording()}
                >
                  {recordingState === "processing" ? "Preparing..." : "Start speaking"}
                </button>
              )}
            </div>
          </div>

          <label
            className={`mt-5 flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-6 text-center transition ${
              isDragging
                ? "border-stone-500 bg-stone-100"
                : "border-stone-300 bg-stone-50 hover:border-stone-500 hover:bg-stone-100"
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
            <span className="rounded-full bg-stone-200 px-4 py-2 text-sm font-semibold text-stone-800">
              Drag and drop or browse
            </span>
            <span className="mt-4 text-lg font-semibold text-stone-900">
              {file ? file.name : "Choose an audio file"}
            </span>
            <span className="mt-2 text-sm text-stone-500">
              {duration
                ? `${duration.toFixed(1)} seconds detected`
                : "Duration is checked before upload"}
            </span>
          </label>

          <button
            className="mt-5 w-full rounded-2xl bg-stone-950 px-5 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            disabled={isSubmitting}
            type="button"
            onClick={() => void submit()}
          >
            {isSubmitting ? "Scoring pronunciation..." : "Score pronunciation"}
          </button>
          <a
            className="mt-3 block text-center text-sm font-semibold text-stone-700 underline-offset-4 hover:underline"
            href="/demo"
          >
            Try without uploading: run the bundled live API demo
          </a>
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
