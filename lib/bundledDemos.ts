import type { PronunciationResult, SegmentFeedback, WordScore } from "./types";

const EXPECTED = "The quick brown fox jumps over the lazy dog";
const PHONEMES: Record<string, string[]> = {
  the: ["DH", "AH"],
  quick: ["K", "W", "IH", "K"],
  kweeck: ["K", "W", "IY", "K"],
  brown: ["B", "R", "AW", "N"],
  fox: ["F", "AA", "K", "S"],
  foks: ["F", "OW", "K", "S"],
  box: ["B", "AA", "K", "S"],
  jumps: ["JH", "AH", "M", "P", "S"],
  jump: ["JH", "AH", "M", "P"],
  over: ["OW", "V", "ER"],
  lazy: ["L", "EY", "Z", "IY"],
  lazee: ["L", "AE", "Z", "IY"],
  dog: ["D", "AO", "G"],
  log: ["L", "AO", "G"],
  slow: ["S", "L", "OW"],
};

type DemoWord = {
  expected?: string;
  actual?: string;
  status: WordScore["status"];
  score: number;
  tip?: string;
};

type DemoDefinition = {
  id: string;
  label: string;
  quality: "Excellent" | "Good" | "Average" | "Poor" | "Strong accent";
  audioPath: string;
  transcript: string;
  score: number;
  confidence: number;
  summary: string;
  words: DemoWord[];
};

export type BundledDemo = DemoDefinition & {
  result: PronunciationResult;
};

const demos: DemoDefinition[] = [
  {
    id: "excellent",
    label: "Excellent delivery",
    quality: "Excellent",
    audioPath: "/demo-excellent.wav",
    transcript: EXPECTED,
    score: 96,
    confidence: 0.97,
    summary: "All target words are clear with strong phoneme alignment.",
    words: [
      "the",
      "quick",
      "brown",
      "fox",
      "jumps",
      "over",
      "the",
      "lazy",
      "dog",
    ].map((word) => ({ expected: word, actual: word, status: "correct", score: 0.98 })),
  },
  {
    id: "good",
    label: "Good with one omission",
    quality: "Good",
    audioPath: "/demo-good.wav",
    transcript: "The quick brown fox jumps over lazy dog",
    score: 84,
    confidence: 0.91,
    summary: "Clear pronunciation, but one short function word was omitted.",
    words: [
      { expected: "the", actual: "the", status: "correct", score: 0.98 },
      { expected: "quick", actual: "quick", status: "correct", score: 0.97 },
      { expected: "brown", actual: "brown", status: "correct", score: 0.97 },
      { expected: "fox", actual: "fox", status: "correct", score: 0.97 },
      { expected: "jumps", actual: "jumps", status: "correct", score: 0.96 },
      { expected: "over", actual: "over", status: "correct", score: 0.96 },
      {
        expected: "the",
        status: "missing",
        score: 0,
        tip: "Add the article before lazy: say 'the lazy dog' as one phrase.",
      },
      { expected: "lazy", actual: "lazy", status: "correct", score: 0.95 },
      { expected: "dog", actual: "dog", status: "correct", score: 0.95 },
    ],
  },
  {
    id: "average",
    label: "Average with consonant error",
    quality: "Average",
    audioPath: "/demo-average.wav",
    transcript: "The quick brown box jumps over the lazy dog",
    score: 71,
    confidence: 0.86,
    summary: "Most words align, but /f/ in 'fox' is heard closer to /b/.",
    words: [
      { expected: "the", actual: "the", status: "correct", score: 0.97 },
      { expected: "quick", actual: "quick", status: "correct", score: 0.95 },
      { expected: "brown", actual: "brown", status: "correct", score: 0.95 },
      {
        expected: "fox",
        actual: "box",
        status: "mispronounced",
        score: 0.56,
        tip: "Start 'fox' with the voiceless /F/ sound. Keep the lower lip near the upper teeth and avoid voicing it like /B/.",
      },
      { expected: "jumps", actual: "jumps", status: "correct", score: 0.94 },
      { expected: "over", actual: "over", status: "correct", score: 0.94 },
      { expected: "the", actual: "the", status: "correct", score: 0.94 },
      { expected: "lazy", actual: "lazy", status: "correct", score: 0.93 },
      { expected: "dog", actual: "dog", status: "correct", score: 0.93 },
    ],
  },
  {
    id: "poor",
    label: "Poor alignment",
    quality: "Poor",
    audioPath: "/demo-poor.wav",
    transcript: "The slow brown box jump over lazy log",
    score: 43,
    confidence: 0.72,
    summary: "Multiple substitutions and omissions reduce intelligibility.",
    words: [
      { expected: "the", actual: "the", status: "correct", score: 0.94 },
      {
        expected: "quick",
        actual: "slow",
        status: "mispronounced",
        score: 0.18,
        tip: "Practice the /K W IH K/ cluster in 'quick' slowly before speaking at full speed.",
      },
      { expected: "brown", actual: "brown", status: "correct", score: 0.9 },
      {
        expected: "fox",
        actual: "box",
        status: "mispronounced",
        score: 0.55,
        tip: "Use /F/ at the start of 'fox', not /B/.",
      },
      {
        expected: "jumps",
        actual: "jump",
        status: "mispronounced",
        score: 0.76,
        tip: "Finish the final /S/ in 'jumps'.",
      },
      { expected: "over", actual: "over", status: "correct", score: 0.9 },
      {
        expected: "the",
        status: "missing",
        score: 0,
        tip: "Include the article before 'lazy'.",
      },
      { expected: "lazy", actual: "lazy", status: "correct", score: 0.88 },
      {
        expected: "dog",
        actual: "log",
        status: "mispronounced",
        score: 0.45,
        tip: "Start 'dog' with /D/. Touch the tongue to the ridge behind the teeth before releasing.",
      },
    ],
  },
  {
    id: "strong-accent",
    label: "Strong accent sample",
    quality: "Strong accent",
    audioPath: "/demo-strong-accent.wav",
    transcript: "The kweeck brown foks jumps over the lazee dog",
    score: 76,
    confidence: 0.8,
    summary: "Understandable speech with vowel shifts on quick, fox, and lazy.",
    words: [
      { expected: "the", actual: "the", status: "correct", score: 0.94 },
      {
        expected: "quick",
        actual: "kweeck",
        status: "mispronounced",
        score: 0.72,
        tip: "Shorten the vowel in 'quick' toward /IH/ instead of a long /IY/ sound.",
      },
      { expected: "brown", actual: "brown", status: "correct", score: 0.93 },
      {
        expected: "fox",
        actual: "foks",
        status: "mispronounced",
        score: 0.78,
        tip: "Round less on the vowel in 'fox'; aim for /AA/ before the /K S/ ending.",
      },
      { expected: "jumps", actual: "jumps", status: "correct", score: 0.92 },
      { expected: "over", actual: "over", status: "correct", score: 0.91 },
      { expected: "the", actual: "the", status: "correct", score: 0.91 },
      {
        expected: "lazy",
        actual: "lazee",
        status: "unclear",
        score: 0.74,
        tip: "Keep the first vowel in 'lazy' closer to /EY/ and reduce the final vowel.",
      },
      { expected: "dog", actual: "dog", status: "correct", score: 0.9 },
    ],
  },
];

export const bundledDemos: BundledDemo[] = demos.map((demo) => ({
  ...demo,
  result: buildResult(demo),
}));

function buildResult(demo: DemoDefinition): PronunciationResult {
  const wordScores = demo.words.map(toWordScore);
  const feedback = wordScores
    .filter((word) => word.status !== "correct")
    .map(toFeedback);
  const expectedCount = 9;
  const issueCount = wordScores.filter((word) => word.status !== "correct").length;
  const phonemeMatchRate = round(
    wordScores.reduce((sum, word) => sum + word.wordScore, 0) / expectedCount,
  );
  const wordAccuracy = round(Math.max(0, 1 - issueCount / expectedCount));

  return {
    id: `bundled-${demo.id}`,
    provider: "Bundled demo pipeline",
    transcript: demo.transcript,
    expectedText: EXPECTED,
    overallScore: demo.score,
    language: "en",
    breakdown: {
      phonemeMatchRate,
      wordAccuracy,
      wordErrorRate: round(1 - wordAccuracy),
      confidence: demo.confidence,
      expectedWordCount: expectedCount,
      transcriptWordCount: demo.transcript.split(/\s+/).length,
    },
    wordScores,
    feedback:
      feedback.length > 0
        ? feedback
        : [
            {
              type: "correct",
              severity: "low",
              message: "All expected words aligned clearly with the transcript.",
              tip: "Keep the same articulation and pacing.",
            },
          ],
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

function toWordScore(word: DemoWord): WordScore {
  const expectedPhonemes = phonemes(word.expected);
  const actualPhonemes = phonemes(word.actual);
  return {
    expected: word.expected,
    actual: word.actual,
    normalizedExpected: word.expected,
    normalizedActual: word.actual,
    status: word.status,
    phonemeScore: round(word.score),
    wordScore: round(word.score),
    expectedPhonemes,
    actualPhonemes,
    tip:
      word.tip ??
      (word.status === "correct"
        ? `Good pronunciation of "${word.expected}".`
        : `Practice "${word.expected}" as ${expectedPhonemes.join(" ")}.`),
  };
}

function toFeedback(word: WordScore): SegmentFeedback {
  if (word.status === "missing") {
    return {
      type: "missing",
      severity: "high",
      expected: word.expected,
      message: `"${word.expected}" was missing from the recording.`,
      tip: word.tip,
    };
  }

  if (word.status === "unclear") {
    return {
      type: "unclear",
      severity: "medium",
      expected: word.expected,
      actual: word.actual,
      message: `"${word.expected}" was understandable but sounded unclear.`,
      tip: word.tip,
    };
  }

  return {
    type: "mispronounced",
    severity: word.phonemeScore < 0.5 ? "high" : "medium",
    expected: word.expected,
    actual: word.actual,
    message: `Expected "${word.expected}", but heard "${word.actual}".`,
    tip: word.tip,
  };
}

function phonemes(word?: string) {
  return word ? (PHONEMES[word.toLowerCase()] ?? [word.toUpperCase()]) : [];
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}
