import { normalizeWord, tokenizeWords } from "./phoneme";
import type { TranscriptSegment, TranscriptWord } from "./types";

export type SttInput = {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
};

export type SttResult = {
  provider: string;
  text: string;
  language?: string;
  words: TranscriptWord[];
  segments: TranscriptSegment[];
};

type Provider = {
  name: string;
  enabled: boolean;
  transcribe: (input: SttInput) => Promise<SttResult>;
};

type GradiumTextMessage = {
  type: "text";
  text: string;
  start_s?: number;
  stream_id?: number;
};

type GradiumEndMessage = {
  type: "end_text";
  stop_s?: number;
  stream_id?: number;
};

type GradiumErrorMessage = {
  type: "error";
  error?: string;
  detail?: string;
  message?: string;
};

type GroqVerboseJson = {
  text?: string;
  language?: string;
  words?: Array<{
    word?: string;
    start?: number;
    end?: number;
    confidence?: number;
  }>;
  segments?: Array<{
    text?: string;
    start?: number;
    end?: number;
    avg_logprob?: number;
  }>;
};

type DeepgramResponse = {
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

export async function transcribeAudio(input: SttInput): Promise<SttResult> {
  const providers: Provider[] = [
    {
      name: "Gradium STT",
      enabled: Boolean(getApiKey("GRADIUM_API_KEY", "GRADIUMAPIKEY")),
      transcribe: transcribeWithGradium,
    },
    {
      name: "Groq Whisper",
      enabled: Boolean(getApiKey("GROQ_API_KEY", "GROQAPIKEY")),
      transcribe: transcribeWithGroq,
    },
    {
      name: "Deepgram",
      enabled: Boolean(getApiKey("DEEPGRAM_API_KEY", "DEEPGRAMAPIKEY")),
      transcribe: transcribeWithDeepgram,
    },
    {
      name: "OpenAI Whisper",
      enabled: Boolean(getApiKey("OPENAI_API_KEY", "OPENAIAPIKEY")),
      transcribe: transcribeWithOpenAI,
    },
  ];

  const errors: string[] = [];

  for (const provider of providers) {
    if (!provider.enabled) {
      continue;
    }

    try {
      const result = await provider.transcribe(input);
      if (!result.text.trim()) {
        throw new Error("Provider returned an empty transcript.");
      }

      return result;
    } catch (error) {
      errors.push(`${provider.name}: ${errorMessage(error)}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`All configured STT providers failed. ${errors.join(" | ")}`);
  }

  throw new Error(
    "No STT provider is configured. Set GRADIUM_API_KEY, GROQ_API_KEY, DEEPGRAM_API_KEY, or OPENAI_API_KEY.",
  );
}

export async function transcribeWithGradium(input: SttInput): Promise<SttResult> {
  const config = encodeURIComponent(JSON.stringify({ language: "en" }));
  const response = await fetch(
    `https://api.gradium.ai/api/post/speech/asr?json_config=${config}`,
    {
      method: "POST",
      headers: {
        "x-api-key": getApiKey("GRADIUM_API_KEY", "GRADIUMAPIKEY") ?? "",
        "content-type": input.mimeType || "application/octet-stream",
      },
      body: blobFromInput(input),
    },
  );

  const body = await response.text();

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${body}`);
  }

  const segments: TranscriptSegment[] = [];
  const pending = new Map<number, GradiumTextMessage>();
  let sequence = 0;

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const message = JSON.parse(line) as
      | GradiumTextMessage
      | GradiumEndMessage
      | GradiumErrorMessage
      | { type?: string };

    if (message.type === "error") {
      const errorMessage = message as GradiumErrorMessage;
      throw new Error(
        errorMessage.error ?? errorMessage.detail ?? errorMessage.message ?? line,
      );
    }

    if (message.type === "text") {
      const textMessage = message as GradiumTextMessage;
      const streamId = textMessage.stream_id ?? sequence;
      pending.set(streamId, textMessage);
      sequence += 1;
      continue;
    }

    if (message.type === "end_text") {
      const endMessage = message as GradiumEndMessage;
      const streamId = endMessage.stream_id ?? sequence - 1;
      const textMessage = pending.get(streamId);

      if (textMessage?.text) {
        segments.push(
          segmentFromText(
            textMessage.text,
            textMessage.start_s,
            endMessage.stop_s,
            undefined,
          ),
        );
        pending.delete(streamId);
      }
    }
  }

  for (const message of pending.values()) {
    if (message.text) {
      segments.push(segmentFromText(message.text, message.start_s));
    }
  }

  const text = segments.map((segment) => segment.text).join(" ").trim();
  const words = segments.flatMap((segment) => segment.words);

  return {
    provider: "Gradium STT",
    text,
    language: "en",
    words,
    segments,
  };
}

export async function transcribeWithGroq(input: SttInput): Promise<SttResult> {
  const formData = new FormData();
  formData.append("file", blobFromInput(input), input.fileName);
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
    },
  );

  return parseOpenAiCompatibleResponse(response, "Groq Whisper");
}

export async function transcribeWithOpenAI(input: SttInput): Promise<SttResult> {
  const formData = new FormData();
  formData.append("file", blobFromInput(input), input.fileName);
  formData.append("model", "whisper-1");
  formData.append("language", "en");
  formData.append("response_format", "verbose_json");
  formData.append("timestamp_granularities[]", "word");
  formData.append("timestamp_granularities[]", "segment");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${getApiKey("OPENAI_API_KEY", "OPENAIAPIKEY")}`,
    },
    body: formData,
  });

  return parseOpenAiCompatibleResponse(response, "OpenAI Whisper");
}

export async function transcribeWithDeepgram(input: SttInput): Promise<SttResult> {
  const response = await fetch(
    "https://api.deepgram.com/v1/listen?model=nova-2&language=en&smart_format=true&punctuate=true&detect_language=false",
    {
      method: "POST",
      headers: {
        authorization: `Token ${getApiKey("DEEPGRAM_API_KEY", "DEEPGRAMAPIKEY")}`,
        "content-type": input.mimeType || "application/octet-stream",
      },
      body: blobFromInput(input),
    },
  );

  const json = (await readJsonResponse(response)) as DeepgramResponse;
  const alternative = json.results?.channels?.[0]?.alternatives?.[0];
  const text = alternative?.transcript?.trim() ?? "";
  const words =
    alternative?.words?.map((word) => ({
      word: word.punctuated_word ?? word.word ?? "",
      normalized: normalizeWord(word.word ?? word.punctuated_word ?? ""),
      start: word.start,
      end: word.end,
      confidence: word.confidence,
    })) ?? [];
  const filteredWords = words.filter((word) => word.normalized);

  return {
    provider: "Deepgram",
    text,
    language: "en",
    words: filteredWords,
    segments: [
      {
        text,
        confidence: alternative?.confidence,
        words: filteredWords,
      },
    ],
  };
}

async function parseOpenAiCompatibleResponse(
  response: Response,
  provider: string,
): Promise<SttResult> {
  const json = (await readJsonResponse(response)) as GroqVerboseJson;
  const text = json.text?.trim() ?? "";
  const words =
    json.words?.map((word) => ({
      word: word.word ?? "",
      normalized: normalizeWord(word.word ?? ""),
      start: word.start,
      end: word.end,
      confidence: word.confidence,
    })) ?? [];
  const filteredWords = words.filter((word) => word.normalized);
  const segments =
    json.segments?.map((segment) =>
      segmentFromText(
        segment.text ?? "",
        segment.start,
        segment.end,
        logProbabilityToConfidence(segment.avg_logprob),
      ),
    ) ?? [];

  return {
    provider,
    text,
    language: json.language,
    words: filteredWords.length > 0 ? filteredWords : segments.flatMap((s) => s.words),
    segments:
      segments.length > 0
        ? segments
        : [
            {
              text,
              words: filteredWords,
            },
          ],
  };
}

async function readJsonResponse(response: Response) {
  const body = await response.text();

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${body}`);
  }

  return JSON.parse(body) as unknown;
}

function segmentFromText(
  text: string,
  start?: number,
  end?: number,
  confidence?: number,
): TranscriptSegment {
  const words = wordsFromText(text, start, end, confidence);

  return {
    text: text.trim(),
    start,
    end,
    confidence,
    words,
  };
}

function wordsFromText(
  text: string,
  start?: number,
  end?: number,
  confidence?: number,
): TranscriptWord[] {
  const tokens = tokenizeWords(text);
  const duration =
    typeof start === "number" && typeof end === "number" && end > start
      ? end - start
      : undefined;

  return tokens.map((word, index) => {
    const wordStart =
      typeof start === "number" && duration
        ? start + (duration * index) / tokens.length
        : undefined;
    const wordEnd =
      typeof start === "number" && duration
        ? start + (duration * (index + 1)) / tokens.length
        : undefined;

    return {
      word,
      normalized: word,
      start: wordStart,
      end: wordEnd,
      confidence,
    };
  });
}

function blobFromInput(input: SttInput) {
  return new Blob([new Uint8Array(input.buffer)], {
    type: input.mimeType || "application/octet-stream",
  });
}

function logProbabilityToConfidence(avgLogprob?: number) {
  if (typeof avgLogprob !== "number") {
    return undefined;
  }

  return Math.min(1, Math.max(0, Math.exp(avgLogprob)));
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function getApiKey(...names: string[]) {
  for (const name of names) {
    const value = process.env[name];
    if (value) {
      return value;
    }
  }

  return undefined;
}
