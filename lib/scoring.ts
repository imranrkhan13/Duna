import {
  levenshtein,
  phonemeSimilarity,
  phonemesForWord,
  tokenizeWords,
} from "./phoneme";
import type {
  PronunciationResult,
  ScoreBreakdown,
  SegmentFeedback,
  TranscriptSegment,
  TranscriptWord,
  WordScore,
} from "./types";

type AlignmentOperation =
  | {
      type: "match" | "substitute";
      expected: string;
      actual: TranscriptWord;
    }
  | {
      type: "delete";
      expected: string;
    }
  | {
      type: "insert";
      actual: TranscriptWord;
    };

type BuildScoreInput = {
  id: string;
  expectedText: string;
  transcript: string;
  provider: string;
  language?: string;
  segments: TranscriptSegment[];
  words: TranscriptWord[];
  expiresAt: Date;
};

export function buildPronunciationResult(
  input: BuildScoreInput,
): PronunciationResult {
  const expectedWords = tokenizeWords(input.expectedText);
  const transcriptWords = input.words.length
    ? input.words
    : tokenizeWords(input.transcript).map((word) => ({
        word,
        normalized: word,
      }));

  const operations = alignWords(expectedWords, transcriptWords);
  const wordScores = operations.map(toWordScore);
  const issueFeedback = wordScores
    .filter((score) => score.status !== "correct")
    .map(toFeedback);

  const feedback =
    issueFeedback.length > 0
      ? issueFeedback
      : [
          {
            type: "correct" as const,
            severity: "low" as const,
            message: "All expected words aligned clearly with the transcript.",
            tip: "Keep the same pace and articulation. Your pronunciation is consistent across this sample.",
          },
        ];

  const breakdown = buildBreakdown(
    expectedWords,
    transcriptWords,
    wordScores,
    input.segments,
  );
  const overallScore = Math.round(
    clamp01(
      breakdown.phonemeMatchRate * 0.65 +
        breakdown.wordAccuracy * 0.25 +
        breakdown.confidence * 0.1,
    ) * 100,
  );

  return {
    id: input.id,
    provider: input.provider,
    transcript: input.transcript,
    expectedText: input.expectedText,
    overallScore,
    language: input.language ?? "en",
    breakdown,
    wordScores,
    feedback,
    expiresAt: input.expiresAt.toISOString(),
  };
}

export function alignWords(
  expectedWords: string[],
  actualWords: TranscriptWord[],
): AlignmentOperation[] {
  const rows = expectedWords.length + 1;
  const columns = actualWords.length + 1;
  const dp = Array.from({ length: rows }, () =>
    Array.from({ length: columns }, () => 0),
  );

  for (let row = 0; row < rows; row += 1) {
    dp[row][0] = row;
  }

  for (let column = 0; column < columns; column += 1) {
    dp[0][column] = column;
  }

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const expected = expectedWords[row - 1] ?? "";
      const actual = actualWords[column - 1]?.normalized ?? "";
      const substitutionCost =
        expected === actual
          ? 0
          : phonemeSimilarity(expected, actual).score >= 0.68
            ? 0.55
            : 1;

      dp[row][column] = Math.min(
        dp[row - 1][column] + 1,
        dp[row][column - 1] + 1,
        dp[row - 1][column - 1] + substitutionCost,
      );
    }
  }

  const operations: AlignmentOperation[] = [];
  let row = expectedWords.length;
  let column = actualWords.length;

  while (row > 0 || column > 0) {
    const expected = expectedWords[row - 1] ?? "";
    const actual = actualWords[column - 1];

    if (row > 0 && column > 0 && actual) {
      const substitutionCost =
        expected === actual.normalized
          ? 0
          : phonemeSimilarity(expected, actual.normalized).score >= 0.68
            ? 0.55
            : 1;

      if (
        almostEqual(
          dp[row][column],
          dp[row - 1][column - 1] + substitutionCost,
        )
      ) {
        operations.push({
          type: substitutionCost === 0 ? "match" : "substitute",
          expected,
          actual,
        });
        row -= 1;
        column -= 1;
        continue;
      }
    }

    if (row > 0 && almostEqual(dp[row][column], dp[row - 1][column] + 1)) {
      operations.push({ type: "delete", expected });
      row -= 1;
      continue;
    }

    if (column > 0 && actual) {
      operations.push({ type: "insert", actual });
      column -= 1;
      continue;
    }

    break;
  }

  return operations.reverse();
}

function toWordScore(operation: AlignmentOperation): WordScore {
  if (operation.type === "insert") {
    return {
      actual: operation.actual.word,
      normalizedActual: operation.actual.normalized,
      status: "extra",
      phonemeScore: 0,
      wordScore: 0,
      start: operation.actual.start,
      end: operation.actual.end,
      expectedPhonemes: [],
      actualPhonemes: phonemesForWord(operation.actual.normalized),
      tip: `Remove the extra word "${operation.actual.word}" if it was not part of the prompt.`,
    };
  }

  if (operation.type === "delete") {
    return {
      expected: operation.expected,
      normalizedExpected: operation.expected,
      status: "missing",
      phonemeScore: 0,
      wordScore: 0,
      expectedPhonemes: phonemesForWord(operation.expected),
      actualPhonemes: [],
      tip: `Make sure to say "${operation.expected}" clearly; it was not detected in the recording.`,
    };
  }

  const similarity = phonemeSimilarity(
    operation.expected,
    operation.actual.normalized,
  );
  const confidence = operation.actual.confidence ?? 0.82;
  const exactWord = operation.expected === operation.actual.normalized;
  const unclear = confidence < 0.55 && similarity.score >= 0.72;
  const status = exactWord && !unclear
    ? "correct"
    : unclear
      ? "unclear"
      : similarity.score >= 0.78
        ? "correct"
        : "mispronounced";
  const wordScore =
    status === "correct"
      ? Math.max(similarity.score, 0.92)
      : status === "unclear"
        ? similarity.score * 0.75
        : similarity.score * 0.72;

  return {
    expected: operation.expected,
    actual: operation.actual.word,
    normalizedExpected: operation.expected,
    normalizedActual: operation.actual.normalized,
    status,
    phonemeScore: round(similarity.score),
    wordScore: round(wordScore),
    start: operation.actual.start,
    end: operation.actual.end,
    expectedPhonemes: similarity.expectedPhonemes,
    actualPhonemes: similarity.actualPhonemes,
    tip:
      status === "correct"
        ? `Good pronunciation of "${operation.expected}".`
        : status === "unclear"
          ? `Repeat "${operation.expected}" with a little more volume and a steadier pace. The sounds matched, but the segment was low confidence.`
          : buildPronunciationTip(
              operation.expected,
              operation.actual.word,
              similarity.expectedPhonemes,
              similarity.actualPhonemes,
            ),
  };
}

function buildBreakdown(
  expectedWords: string[],
  transcriptWords: TranscriptWord[],
  wordScores: WordScore[],
  segments: TranscriptSegment[],
): ScoreBreakdown {
  const phonemeMatchRate =
    wordScores
      .filter((score) => score.status !== "extra")
      .reduce((sum, score) => sum + score.wordScore, 0) /
    Math.max(expectedWords.length, 1);
  const wordErrors = levenshtein(
    expectedWords,
    transcriptWords.map((word) => word.normalized),
  );
  const wordErrorRate = wordErrors / Math.max(expectedWords.length, 1);
  const wordAccuracy = clamp01(1 - wordErrorRate);
  const confidence = averageConfidence(transcriptWords, segments);

  return {
    phonemeMatchRate: round(clamp01(phonemeMatchRate)),
    wordAccuracy: round(wordAccuracy),
    wordErrorRate: round(Math.max(0, wordErrorRate)),
    confidence: round(confidence),
    expectedWordCount: expectedWords.length,
    transcriptWordCount: transcriptWords.length,
  };
}

function averageConfidence(
  words: TranscriptWord[],
  segments: TranscriptSegment[],
) {
  const wordConfidences = words
    .map((word) => word.confidence)
    .filter((confidence): confidence is number => typeof confidence === "number");

  if (wordConfidences.length > 0) {
    return clamp01(
      wordConfidences.reduce((sum, value) => sum + value, 0) /
        wordConfidences.length,
    );
  }

  const segmentConfidences = segments
    .map((segment) => segment.confidence)
    .filter((confidence): confidence is number => typeof confidence === "number");

  if (segmentConfidences.length > 0) {
    return clamp01(
      segmentConfidences.reduce((sum, value) => sum + value, 0) /
        segmentConfidences.length,
    );
  }

  return 0.78;
}

function toFeedback(score: WordScore): SegmentFeedback {
  if (score.status === "missing") {
    return {
      type: "missing",
      severity: "high",
      expected: score.expected,
      message: `"${score.expected}" was missing from the recording.`,
      tip: score.tip,
    };
  }

  if (score.status === "extra") {
    return {
      type: "extra",
      severity: "medium",
      actual: score.actual,
      start: score.start,
      end: score.end,
      message: `Extra word detected: "${score.actual}".`,
      tip: score.tip,
    };
  }

  if (score.status === "unclear") {
    return {
      type: "unclear",
      severity: "medium",
      expected: score.expected,
      actual: score.actual,
      start: score.start,
      end: score.end,
      message: `"${score.expected}" matched phonetically but sounded unclear.`,
      tip: score.tip,
    };
  }

  return {
    type: "mispronounced",
    severity: score.phonemeScore < 0.45 ? "high" : "medium",
    expected: score.expected,
    actual: score.actual,
    start: score.start,
    end: score.end,
    message: `Expected "${score.expected}", but heard "${score.actual}".`,
    tip: score.tip,
  };
}

function buildPronunciationTip(
  expected: string,
  actual: string,
  expectedPhonemes: string[],
  actualPhonemes: string[],
) {
  const expectedSounds = expectedPhonemes.join(" ");
  const actualSounds = actualPhonemes.join(" ");

  return `Practice "${expected}" slowly as ${expectedSounds}. The transcript sounded closer to "${actual}" (${actualSounds}), so focus on the changed sound before returning to normal speed.`;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}

function almostEqual(left: number, right: number) {
  return Math.abs(left - right) < 0.00001;
}
