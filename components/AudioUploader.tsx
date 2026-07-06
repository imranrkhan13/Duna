"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Recorder } from "./assessment/Recorder";
import { StepCard } from "./assessment/StepCard";
import { UploadCard } from "./assessment/UploadCard";
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
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-gray-200 bg-white p-4 shadow-[0_20px_80px_rgba(17,24,39,0.05)]">
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            ["Consent", accepted],
            ["Passage", wordCount >= 5],
            ["Audio", Boolean(file)],
            ["Score", Boolean(result)],
          ].map(([label, done], index) => (
            <div
              className="rounded-2xl bg-[#FAFAFA] p-3 text-sm"
              key={String(label)}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${
                    done
                      ? "bg-blue-600 text-white"
                      : "border border-gray-200 bg-white text-gray-500"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="font-medium text-gray-950">{label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <StepCard
        complete={accepted}
        description="Required before recording or uploading. Audio is processed temporarily and never persisted by the app."
        step={1}
        title="Consent"
      >
        <ConsentBanner accepted={accepted} onAcceptedChange={setAccepted} />
      </StepCard>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <StepCard
          complete={wordCount >= 5}
          description="Paste the learner prompt. The scoring engine compares this text against the real STT transcript."
          step={2}
          title="Passage"
        >
          <textarea
            aria-label="Expected passage"
            className="min-h-56 w-full resize-none rounded-[1.5rem] border border-gray-200 bg-[#FAFAFA] p-5 text-base leading-7 text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            value={expectedText}
            onChange={(event) => setExpectedText(event.target.value)}
          />
          <p className="mt-3 text-sm text-gray-500">
            {wordCount} words. Use a passage that naturally takes 30-45 seconds
            to read.
          </p>
        </StepCard>

        <StepCard
          complete={Boolean(file)}
          description="Record with the browser mic or upload a 30-45 second English audio file."
          step={3}
          title="Audio"
        >
          <div className="space-y-5">
            <Recorder
              seconds={recordingSeconds}
              state={recordingState}
              onStart={() => void startRecording()}
              onStop={stopRecording}
            />
            <UploadCard
              duration={duration}
              fileName={file?.name}
              isDragging={isDragging}
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
              onFile={(nextFile) => void handleFile(nextFile)}
            />
          </div>
          <button
            className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-blue-600 px-5 text-sm font-medium text-white shadow-[0_14px_34px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300"
            disabled={isSubmitting}
            type="button"
            onClick={() => void submit()}
          >
            {isSubmitting ? "Scoring pronunciation..." : "Score pronunciation"}
          </button>
          <a
            className="mt-3 block text-center text-sm font-medium text-gray-500 underline-offset-4 transition hover:text-blue-600 hover:underline"
            href="/demo"
          >
            Try without uploading: run the bundled live API demo
          </a>
        </StepCard>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-900">
          {error}
        </div>
      ) : null}

      {result ? (
        <StepCard
          complete
          description="A deterministic report with score breakdown, aligned words, and timeline feedback."
          step={4}
          title="Score"
        >
          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <ScoreDisplay result={result} />
            <FeedbackPanel feedback={result.feedback} />
          </section>
        </StepCard>
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
