import { parseBuffer } from "music-metadata";
import { NextResponse } from "next/server";

import {
  assertConsent,
  createResultId,
  getExpiryDate,
  rememberResult,
} from "@/lib/dpdp";
import { isLikelyEnglishTranscript, tokenizeWords } from "@/lib/phoneme";
import { buildPronunciationResult } from "@/lib/scoring";
import { transcribeAudio } from "@/lib/stt";
import type { UploadError } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MIN_DURATION_SECONDS = 30;
const MAX_DURATION_SECONDS = 45;
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    assertConsent(formData.get("consent"));

    const expectedText = getString(formData.get("expectedText")).trim();
    if (tokenizeWords(expectedText).length < 5) {
      return errorResponse(
        "Please provide the expected English passage before uploading audio.",
        400,
      );
    }

    const audio = formData.get("audio");
    if (!(audio instanceof File)) {
      return errorResponse("Upload an audio file to continue.", 400);
    }

    if (!audio.type.startsWith("audio/")) {
      return errorResponse("Only audio files are supported.", 400);
    }

    if (audio.size > MAX_AUDIO_BYTES) {
      return errorResponse("Audio files must be 25 MB or smaller.", 413);
    }

    const buffer = Buffer.from(await audio.arrayBuffer());
    const duration = await readDuration(buffer, audio.type);

    if (
      duration < MIN_DURATION_SECONDS ||
      duration > MAX_DURATION_SECONDS
    ) {
      return errorResponse(
        `Audio must be between ${MIN_DURATION_SECONDS} and ${MAX_DURATION_SECONDS} seconds. This file is ${duration.toFixed(1)} seconds.`,
        400,
      );
    }

    const transcription = await transcribeAudio({
      buffer,
      mimeType: audio.type,
      fileName: audio.name || "speech-upload",
    });

    if (
      !isLikelyEnglishTranscript(transcription.text, transcription.language)
    ) {
      return errorResponse(
        "The uploaded speech does not appear to be English. Please upload a clear English speech sample.",
        422,
      );
    }

    const result = buildPronunciationResult({
      id: createResultId(),
      expectedText,
      transcript: transcription.text,
      provider: transcription.provider,
      language: transcription.language,
      segments: transcription.segments,
      words: transcription.words,
      expiresAt: getExpiryDate(),
    });

    rememberResult(result);

    return NextResponse.json(result, {
      headers: {
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(
      "We could not score this recording.",
      500,
      error instanceof Error ? error.message : String(error),
    );
  }
}

function getString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

async function readDuration(buffer: Buffer, mimeType: string) {
  try {
    const metadata = await parseBuffer(buffer, { mimeType });
    const duration = metadata.format.duration;

    if (!duration || !Number.isFinite(duration)) {
      throw new Error("No duration metadata found.");
    }

    return duration;
  } catch (error) {
    throw new Error(
      `Unable to read audio duration. Use a standard browser-playable audio file such as WAV, MP3, M4A, OGG, or WebM. ${error instanceof Error ? error.message : ""}`,
    );
  }
}

function errorResponse(error: string, status: number, detail?: string) {
  const body: UploadError = { error, detail };
  return NextResponse.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}
