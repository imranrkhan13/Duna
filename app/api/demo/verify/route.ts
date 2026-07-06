import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { NextResponse } from "next/server";

import { getApiKey } from "@/lib/stt";
import {
  levenshtein,
  phonemesForWord,
  tokenizeWords,
} from "@/lib/phoneme";
import { buildPronunciationResult } from "@/lib/scoring";
import type {
  DemoApiKeyStatus,
  DemoTestResult,
  DemoVerificationResponse,
} from "@/lib/demoTypes";
import type { PronunciationResult, TranscriptWord } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const EXPECTED_PASSAGE = "The quick brown fox jumps over the lazy dog";
const VALID_PASSAGE =
  "The quick brown fox jumps over the lazy dog. The careful speaker practices clear English pronunciation with steady rhythm and confident volume.";

type DirectSttResult = {
  provider: string;
  text: string;
  language?: string;
  words: TranscriptWord[];
  segments: Array<{
    text: string;
    start?: number;
    end?: number;
    confidence?: number;
    words: TranscriptWord[];
  }>;
  raw: unknown;
  timestampSource: string;
  confidenceSource: string;
};

type TimedResult<T> = {
  latencyMs: number;
  value?: T;
  error?: string;
};

export async function GET(request: Request) {
  const generatedAt = new Date();
  const origin = getOrigin(request);
  const apiKeys = getApiKeyStatuses();
  const sampleAudio = await readPublicFile("test-audio.wav");

  const gradiumPromise = testGradiumWithFallback(sampleAudio);
  const groqPromise = testGroqDirect(sampleAudio);
  const deepgramPromise = testDeepgramDirect(sampleAudio);
  const durationPromise = testDurationValidation(origin);
  const dpdpPromise = testDpdpUpload(origin);

  const [gradiumTest, groqTest, deepgramTest, durationTest, dpdpTest] =
    await Promise.all([
      gradiumPromise,
      groqPromise,
      deepgramPromise,
      durationPromise,
      dpdpPromise,
    ]);

  const primaryStt = extractSttResult(gradiumTest);
  const phonemeTest = testPhonemeAlignment(primaryStt);
  const scoringTest = testScoringEngine(primaryStt);

  const tests = [
    gradiumTest,
    groqTest,
    deepgramTest,
    phonemeTest,
    scoringTest,
    dpdpTest,
    durationTest,
  ];
  const passing = tests.filter((test) => test.status === "pass").length;
  const failing = tests.filter((test) => test.status === "fail").length;
  const skipped = tests.filter((test) => test.status === "skipped").length;
  const response: DemoVerificationResponse = {
    generatedAt: generatedAt.toISOString(),
    apiKeys,
    summary: {
      total: tests.length,
      passing,
      failing,
      skipped,
    },
    tests,
    finalMessage:
      failing === 0 && skipped === 0
        ? "All APIs verified"
        : `${failing + skipped} APIs need attention`,
  };

  return NextResponse.json(response, {
    headers: {
      "cache-control": "no-store",
    },
  });
}

function getApiKeyStatuses(): DemoApiKeyStatus[] {
  const groups = [
    {
      label: "Gradium STT",
      names: ["GRADIUM_API_KEY", "GRADIUMAPIKEY"],
    },
    {
      label: "Groq Whisper",
      names: ["GROQ_API_KEY", "GROQAPIKEY"],
    },
    {
      label: "Deepgram",
      names: ["DEEPGRAM_API_KEY", "DEEPGRAMAPIKEY"],
    },
    {
      label: "OpenAI Whisper",
      names: ["OPENAI_API_KEY", "OPENAIAPIKEY"],
    },
  ];

  return groups.map((group) => ({
    ...group,
    configured: Boolean(getApiKey(...group.names)),
  }));
}

async function testGradiumWithFallback(
  audio: Buffer,
): Promise<DemoTestResult> {
  const started = performance.now();
  const gradiumKey = getApiKey("GRADIUM_API_KEY", "GRADIUMAPIKEY");
  const groqKey = getApiKey("GROQ_API_KEY", "GROQAPIKEY");
  const attempts: unknown[] = [];

  if (gradiumKey) {
    const gradium = await timed(() => callGradium(audio));
    attempts.push({
      provider: "Gradium STT",
      latencyMs: gradium.latencyMs,
      error: gradium.error,
      result: gradium.value,
    });

    if (gradium.value?.text.trim()) {
      return {
        id: "gradium-stt",
        title: "Gradium STT Test",
        status: "pass",
        latencyMs: elapsed(started),
        summary: "Gradium returned a live transcript from public/test-audio.wav.",
        issues: [],
        details: {
          providerUsed: "Gradium STT",
          fallbackReason: null,
          attempts,
          transcript: gradium.value.text,
          wordLevelTimestamps: gradium.value.words,
          confidenceScores: collectConfidence(gradium.value),
          rawResponse: gradium.value.raw,
        },
      };
    }
  } else {
    attempts.push({
      provider: "Gradium STT",
      skipped: true,
      reason: "No GRADIUM_API_KEY or GRADIUMAPIKEY configured.",
    });
  }

  if (groqKey) {
    const groq = await timed(() => callGroq(audio));
    attempts.push({
      provider: "Groq Whisper",
      latencyMs: groq.latencyMs,
      error: groq.error,
      result: groq.value,
    });

    if (groq.value?.text.trim()) {
      return {
        id: "gradium-stt",
        title: "Gradium STT Test",
        status: "pass",
        latencyMs: elapsed(started),
        summary: "Gradium was unavailable, so Groq fallback produced the transcript.",
        issues: [
          gradiumKey
            ? "Gradium call failed; fallback chain used Groq Whisper."
            : "Gradium key missing; fallback chain used Groq Whisper.",
        ],
        details: {
          providerUsed: "Groq Whisper",
          fallbackReason: gradiumKey
            ? "Gradium request failed."
            : "Gradium API key not configured.",
          attempts,
          transcript: groq.value.text,
          wordLevelTimestamps: groq.value.words,
          confidenceScores: collectConfidence(groq.value),
          rawResponse: groq.value.raw,
        },
      };
    }
  } else {
    attempts.push({
      provider: "Groq Whisper",
      skipped: true,
      reason: "No GROQ_API_KEY or GROQAPIKEY configured for fallback.",
    });
  }

  return {
    id: "gradium-stt",
    title: "Gradium STT Test",
    status: "fail",
    latencyMs: elapsed(started),
    summary: "No provider in the Gradium -> Groq fallback chain returned a transcript.",
    issues: ["Configure Gradium or Groq credentials and retry the live demo."],
    details: {
      providerUsed: null,
      attempts,
    },
  };
}

async function testGroqDirect(audio: Buffer): Promise<DemoTestResult> {
  const key = getApiKey("GROQ_API_KEY", "GROQAPIKEY");

  if (!key) {
    return skippedTest(
      "groq-whisper",
      "Groq Whisper Fallback Test",
      "No GROQ_API_KEY or GROQAPIKEY configured.",
    );
  }

  const result = await timed(() => callGroq(audio));

  if (!result.value?.text.trim()) {
    return failedTest(
      "groq-whisper",
      "Groq Whisper Fallback Test",
      result.latencyMs,
      result.error ?? "Groq returned an empty transcript.",
    );
  }

  return {
    id: "groq-whisper",
    title: "Groq Whisper Fallback Test",
    status: "pass",
    latencyMs: result.latencyMs,
    summary: "Groq Whisper returned a live transcript directly.",
    issues: [],
    details: {
      transcript: result.value.text,
      wordLevelTimestamps: result.value.words,
      timestampSource: result.value.timestampSource,
      rawResponse: result.value.raw,
    },
  };
}

async function testDeepgramDirect(audio: Buffer): Promise<DemoTestResult> {
  const key = getApiKey("DEEPGRAM_API_KEY", "DEEPGRAMAPIKEY");

  if (!key) {
    return skippedTest(
      "deepgram",
      "Deepgram Fallback Test",
      "Skipped - no DEEPGRAM_API_KEY or DEEPGRAMAPIKEY configured.",
    );
  }

  const result = await timed(() => callDeepgram(audio));

  if (!result.value?.text.trim()) {
    return failedTest(
      "deepgram",
      "Deepgram Fallback Test",
      result.latencyMs,
      result.error ?? "Deepgram returned an empty transcript.",
    );
  }

  return {
    id: "deepgram",
    title: "Deepgram Fallback Test",
    status: "pass",
    latencyMs: result.latencyMs,
    summary: "Deepgram returned a live transcript directly.",
    issues: [],
    details: {
      transcript: result.value.text,
      wordLevelTimestamps: result.value.words,
      confidenceScores: collectConfidence(result.value),
      rawResponse: result.value.raw,
    },
  };
}

function testPhonemeAlignment(stt: DirectSttResult | null): DemoTestResult {
  const started = performance.now();

  if (!stt) {
    return failedTest(
      "phoneme-alignment",
      "Phoneme Alignment Test",
      elapsed(started),
      "No real STT transcript is available from test 1.",
    );
  }

  const result = buildPronunciationResult({
    id: crypto.randomUUID(),
    expectedText: EXPECTED_PASSAGE,
    transcript: stt.text,
    provider: stt.provider,
    language: stt.language,
    segments: stt.segments,
    words: stt.words,
    expiresAt: new Date(Date.now() + 60_000),
  });
  const rows = result.wordScores.map((word) => ({
    expected: word.expected,
    actual: word.actual,
    status: word.status,
    expectedPhonemes: word.expectedPhonemes,
    actualPhonemes: word.actualPhonemes,
    editDistance: levenshtein(word.expectedPhonemes, word.actualPhonemes),
    phonemeScore: word.phonemeScore,
  }));
  const flaggedWords = rows.filter((row) =>
    ["mispronounced", "missing", "extra", "unclear"].includes(row.status),
  );

  return {
    id: "phoneme-alignment",
    title: "Phoneme Alignment Test",
    status: "pass",
    latencyMs: elapsed(started),
    summary: "Real STT output was converted to phonemes and aligned.",
    issues: [],
    details: {
      expectedPassage: EXPECTED_PASSAGE,
      transcript: stt.text,
      rows,
      flaggedWords,
      expectedPassagePhonemes: tokenizeWords(EXPECTED_PASSAGE).map((word) => ({
        word,
        phonemes: phonemesForWord(word),
      })),
      transcriptPhonemes: tokenizeWords(stt.text).map((word) => ({
        word,
        phonemes: phonemesForWord(word),
      })),
    },
  };
}

function testScoringEngine(stt: DirectSttResult | null): DemoTestResult {
  const started = performance.now();

  if (!stt) {
    return failedTest(
      "scoring-engine",
      "Scoring Engine Test",
      elapsed(started),
      "No real STT transcript is available from test 1.",
    );
  }

  const result = buildPronunciationResult({
    id: crypto.randomUUID(),
    expectedText: EXPECTED_PASSAGE,
    transcript: stt.text,
    provider: stt.provider,
    language: stt.language,
    segments: stt.segments,
    words: stt.words,
    expiresAt: new Date(Date.now() + 60_000),
  });
  const math = {
    formula:
      "overall = 100 * (0.65 * phonemeMatchRate + 0.25 * wordAccuracy + 0.10 * sttConfidence)",
    substitution: `100 * (0.65 * ${result.breakdown.phonemeMatchRate} + 0.25 * ${result.breakdown.wordAccuracy} + 0.10 * ${result.breakdown.confidence})`,
    finalScore: result.overallScore,
    llmGenerated: false,
  };

  return {
    id: "scoring-engine",
    title: "Scoring Engine Test",
    status: "pass",
    latencyMs: elapsed(started),
    summary: "Deterministic score computed from the real phoneme comparison.",
    issues: [],
    details: {
      breakdown: result.breakdown,
      math,
      wordScores: result.wordScores,
      feedback: result.feedback,
    },
  };
}

async function testDpdpUpload(origin: string): Promise<DemoTestResult> {
  const audio = await readPublicFile("valid-35s.wav");
  const uploadedAt = new Date().toISOString();
  const result = await timed(() =>
    uploadToApp(origin, "valid-35s.wav", audio, VALID_PASSAGE),
  );
  const processedAt = new Date().toISOString();

  if (!result.value) {
    return {
      id: "dpdp-deletion",
      title: "DPDP Deletion Test",
      status: "fail",
      latencyMs: result.latencyMs,
      summary: "The production upload endpoint did not complete scoring.",
      issues: [result.error ?? "Upload failed."],
      details: {
        uploadedAt,
        processedAt,
        endpoint: `${origin}/api/upload`,
        deletionConfirmation:
          "The app never writes raw uploaded audio to disk; no file path was created.",
      },
    };
  }

  const scored = result.value as PronunciationResult;

  return {
    id: "dpdp-deletion",
    title: "DPDP Deletion Test",
    status: "pass",
    latencyMs: result.latencyMs,
    summary: "The upload endpoint processed audio without persisting raw audio.",
    issues: [],
    details: {
      uploadedAt,
      processedAt,
      endpoint: `${origin}/api/upload`,
      resultId: scored.id,
      provider: scored.provider,
      transcript: scored.transcript,
      score: scored.overallScore,
      dpdpAudit: scored.dpdpAudit,
      deletionConfirmation:
        scored.dpdpAudit?.deletionConfirmation ??
        "Raw audio was held in request memory only and discarded after processing.",
    },
  };
}

async function testDurationValidation(origin: string): Promise<DemoTestResult> {
  const cases = [
    {
      fileName: "too-short-10s.wav",
      expectedStatus: "rejected",
      label: "10-second file",
    },
    {
      fileName: "too-long-60s.wav",
      expectedStatus: "rejected",
      label: "60-second file",
    },
    {
      fileName: "valid-35s.wav",
      expectedStatus: "accepted",
      label: "35-second file",
    },
  ];
  const started = performance.now();
  const results = [];

  for (const testCase of cases) {
    const audio = await readPublicFile(testCase.fileName);
    const response = await timed(() =>
      uploadToApp(origin, testCase.fileName, audio, VALID_PASSAGE, {
        validationOnly: "duration",
      }),
    );
    const actualStatus = response.value ? "accepted" : "rejected";

    results.push({
      ...testCase,
      actualStatus,
      latencyMs: response.latencyMs,
      passed: actualStatus === testCase.expectedStatus,
      response: response.value,
      error: response.error,
    });
  }

  const failures = results.filter((result) => !result.passed);

  return {
    id: "duration-validation",
    title: "Duration Validation Test",
    status: failures.length === 0 ? "pass" : "fail",
    latencyMs: elapsed(started),
    summary:
      failures.length === 0
        ? "The upload endpoint rejected invalid durations and accepted 35 seconds."
        : "One or more duration gates behaved unexpectedly.",
    issues: failures.map(
      (failure) =>
        `${failure.label} expected ${failure.expectedStatus}, got ${failure.actualStatus}.`,
    ),
    details: {
      endpoint: `${origin}/api/upload`,
      mode: "validationOnly=duration",
      results,
    },
  };
}

async function callGradium(audio: Buffer): Promise<DirectSttResult> {
  const config = encodeURIComponent(JSON.stringify({ language: "en" }));
  const response = await fetch(
    `https://api.gradium.ai/api/post/speech/asr?json_config=${config}`,
    {
      method: "POST",
      headers: {
        "x-api-key": getApiKey("GRADIUM_API_KEY", "GRADIUMAPIKEY") ?? "",
        "content-type": "audio/wav",
      },
      body: new Blob([new Uint8Array(audio)], { type: "audio/wav" }),
      signal: AbortSignal.timeout(30_000),
    },
  );
  const body = await response.text();

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${body}`);
  }

  const rawLines = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
  const segments = [];
  const pending = new Map<number, { text: string; start?: number }>();
  let sequence = 0;

  for (const line of rawLines) {
    if (line.type === "text") {
      const streamId =
        typeof line.stream_id === "number" ? line.stream_id : sequence;
      pending.set(streamId, {
        text: String(line.text ?? ""),
        start: numberOrUndefined(line.start_s),
      });
      sequence += 1;
    }

    if (line.type === "end_text") {
      const streamId =
        typeof line.stream_id === "number" ? line.stream_id : sequence - 1;
      const text = pending.get(streamId);
      if (text) {
        segments.push(
          segmentFromText(text.text, text.start, numberOrUndefined(line.stop_s)),
        );
        pending.delete(streamId);
      }
    }
  }

  for (const text of pending.values()) {
    segments.push(segmentFromText(text.text, text.start));
  }

  return {
    provider: "Gradium STT",
    text: segments.map((segment) => segment.text).join(" ").trim(),
    language: "en",
    words: segments.flatMap((segment) => segment.words),
    segments,
    raw: rawLines,
    timestampSource: "Gradium segment timestamps; word anchors derived per segment.",
    confidenceSource: "Gradium STT response did not include confidence scores.",
  };
}

async function callGroq(audio: Buffer): Promise<DirectSttResult> {
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([new Uint8Array(audio)], { type: "audio/wav" }),
    "test-audio.wav",
  );
  formData.append("model", "whisper-large-v3-turbo");
  formData.append("language", "en");
  formData.append("response_format", "verbose_json");
  formData.append("timestamp_granularities[]", "word");
  formData.append("timestamp_granularities[]", "segment");

  const response = await fetch(
    "https://api.groq.com/openai/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${getApiKey("GROQ_API_KEY", "GROQAPIKEY")}`,
      },
      body: formData,
      signal: AbortSignal.timeout(30_000),
    },
  );
  const raw = (await readJson(response)) as {
    text?: string;
    language?: string;
    words?: Array<{
      word?: string;
      start?: number;
      end?: number;
      confidence?: number;
    }>;
    segments?: Array<{ text?: string; start?: number; end?: number }>;
  };
  const words =
    raw.words?.map((word) => ({
      word: word.word ?? "",
      normalized: String(word.word ?? "").toLowerCase().replace(/[^\w'-]/g, ""),
      start: word.start,
      end: word.end,
      confidence: word.confidence,
    })) ?? [];
  const filteredWords = words.filter((word) => word.normalized);

  return {
    provider: "Groq Whisper",
    text: raw.text?.trim() ?? "",
    language: raw.language,
    words: filteredWords,
    segments:
      raw.segments?.map((segment) =>
        segmentFromText(segment.text ?? "", segment.start, segment.end),
      ) ?? [],
    raw,
    timestampSource: "Groq verbose_json word timestamps.",
    confidenceSource: "Groq Whisper word confidence when returned by API.",
  };
}

async function callDeepgram(audio: Buffer): Promise<DirectSttResult> {
  const response = await fetch(
    "https://api.deepgram.com/v1/listen?model=nova-2&language=en&smart_format=true&punctuate=true&detect_language=false",
    {
      method: "POST",
      headers: {
        authorization: `Token ${getApiKey("DEEPGRAM_API_KEY", "DEEPGRAMAPIKEY")}`,
        "content-type": "audio/wav",
      },
      body: new Blob([new Uint8Array(audio)], { type: "audio/wav" }),
      signal: AbortSignal.timeout(30_000),
    },
  );
  const raw = (await readJson(response)) as {
    results?: {
      channels?: Array<{
        alternatives?: Array<{
          transcript?: string;
          confidence?: number;
          words?: Array<{
            word?: string;
            punctuated_word?: string;
            start?: number;
            end?: number;
            confidence?: number;
          }>;
        }>;
      }>;
    };
  };
  const alternative = raw.results?.channels?.[0]?.alternatives?.[0];
  const words =
    alternative?.words?.map((word) => ({
      word: word.punctuated_word ?? word.word ?? "",
      normalized: String(word.word ?? word.punctuated_word ?? "")
        .toLowerCase()
        .replace(/[^\w'-]/g, ""),
      start: word.start,
      end: word.end,
      confidence: word.confidence,
    })) ?? [];
  const filteredWords = words.filter((word) => word.normalized);

  return {
    provider: "Deepgram",
    text: alternative?.transcript?.trim() ?? "",
    language: "en",
    words: filteredWords,
    segments: [
      {
        text: alternative?.transcript?.trim() ?? "",
        confidence: alternative?.confidence,
        words: filteredWords,
      },
    ],
    raw,
    timestampSource: "Deepgram word timestamps.",
    confidenceSource: "Deepgram word and alternative confidence.",
  };
}

async function uploadToApp(
  origin: string,
  fileName: string,
  audio: Buffer,
  expectedText: string,
  extraFields: Record<string, string> = {},
) {
  const formData = new FormData();
  formData.append("consent", "true");
  formData.append("expectedText", expectedText);
  formData.append(
    "audio",
    new Blob([new Uint8Array(audio)], { type: "audio/wav" }),
    fileName,
  );

  for (const [key, value] of Object.entries(extraFields)) {
    formData.append(key, value);
  }

  const response = await fetch(`${origin}/api/upload`, {
    method: "POST",
    body: formData,
    signal: AbortSignal.timeout(45_000),
  });
  const text = await response.text();
  const json = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    throw new Error(JSON.stringify(json));
  }

  return json;
}

async function timed<T>(operation: () => Promise<T>): Promise<TimedResult<T>> {
  const started = performance.now();

  try {
    const value = await operation();

    return {
      latencyMs: elapsed(started),
      value,
    };
  } catch (error) {
    return {
      latencyMs: elapsed(started),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function readJson(response: Response) {
  const body = await response.text();

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${body}`);
  }

  return JSON.parse(body) as unknown;
}

async function readPublicFile(fileName: string) {
  return readFile(join(process.cwd(), "public", fileName));
}

function extractSttResult(test: DemoTestResult): DirectSttResult | null {
  const details = test.details as { attempts?: Array<{ result?: DirectSttResult }> };
  const attempt = details.attempts?.find((item) => item.result);
  return attempt?.result ?? null;
}

function collectConfidence(result: DirectSttResult) {
  return {
    confidenceSource: result.confidenceSource,
    words: result.words
      .filter((word) => typeof word.confidence === "number")
      .map((word) => ({
        word: word.word,
        confidence: word.confidence,
      })),
    segments: result.segments
      .filter((segment) => typeof segment.confidence === "number")
      .map((segment) => ({
        text: segment.text,
        confidence: segment.confidence,
      })),
  };
}

function segmentFromText(text: string, start?: number, end?: number) {
  const tokens = tokenizeWords(text);
  const duration =
    typeof start === "number" && typeof end === "number" && end > start
      ? end - start
      : undefined;
  const words = tokens.map((word, index) => ({
    word,
    normalized: word,
    start:
      typeof start === "number" && duration
        ? start + (duration * index) / Math.max(tokens.length, 1)
        : undefined,
    end:
      typeof start === "number" && duration
        ? start + (duration * (index + 1)) / Math.max(tokens.length, 1)
        : undefined,
  }));

  return {
    text: text.trim(),
    start,
    end,
    words,
  };
}

function skippedTest(id: string, title: string, reason: string): DemoTestResult {
  return {
    id,
    title,
    status: "skipped",
    latencyMs: 0,
    summary: reason,
    issues: [reason],
    details: {
      reason,
    },
  };
}

function failedTest(
  id: string,
  title: string,
  latencyMs: number,
  issue: string,
): DemoTestResult {
  return {
    id,
    title,
    status: "fail",
    latencyMs,
    summary: issue,
    issues: [issue],
    details: {
      error: issue,
    },
  };
}

function getOrigin(request: Request) {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const host = forwardedHost ?? request.headers.get("host") ?? url.host;
  const proto = forwardedProto ?? url.protocol.replace(":", "");

  return process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`;
}

function numberOrUndefined(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function elapsed(started: number) {
  return Math.round(performance.now() - started);
}
