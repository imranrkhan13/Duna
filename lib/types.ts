export type FeedbackType =
  | "mispronounced"
  | "unclear"
  | "missing"
  | "extra"
  | "correct";

export type AlignmentStatus =
  | "correct"
  | "mispronounced"
  | "unclear"
  | "missing"
  | "extra";

export type TranscriptWord = {
  word: string;
  normalized: string;
  start?: number;
  end?: number;
  confidence?: number;
};

export type TranscriptSegment = {
  text: string;
  start?: number;
  end?: number;
  confidence?: number;
  words: TranscriptWord[];
};

export type WordScore = {
  expected?: string;
  actual?: string;
  normalizedExpected?: string;
  normalizedActual?: string;
  status: AlignmentStatus;
  phonemeScore: number;
  wordScore: number;
  start?: number;
  end?: number;
  expectedPhonemes: string[];
  actualPhonemes: string[];
  tip: string;
};

export type SegmentFeedback = {
  type: FeedbackType;
  severity: "low" | "medium" | "high";
  expected?: string;
  actual?: string;
  start?: number;
  end?: number;
  message: string;
  tip: string;
};

export type ScoreBreakdown = {
  phonemeMatchRate: number;
  wordAccuracy: number;
  wordErrorRate: number;
  confidence: number;
  expectedWordCount: number;
  transcriptWordCount: number;
};

export type PronunciationResult = {
  id: string;
  provider: string;
  transcript: string;
  expectedText: string;
  overallScore: number;
  language: string;
  breakdown: ScoreBreakdown;
  wordScores: WordScore[];
  feedback: SegmentFeedback[];
  expiresAt: string;
};

export type UploadError = {
  error: string;
  detail?: string;
};
