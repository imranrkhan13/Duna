import { dictionary } from "cmu-pronouncing-dictionary";

const DIGRAPH_PHONEMES: Array<[string, string[]]> = [
  ["tion", ["SH", "AH", "N"]],
  ["sion", ["ZH", "AH", "N"]],
  ["ough", ["AO", "F"]],
  ["eigh", ["EY"]],
  ["igh", ["AY"]],
  ["ph", ["F"]],
  ["th", ["TH"]],
  ["sh", ["SH"]],
  ["ch", ["CH"]],
  ["ng", ["NG"]],
  ["qu", ["K", "W"]],
  ["ck", ["K"]],
  ["wh", ["W"]],
  ["ee", ["IY"]],
  ["oo", ["UW"]],
  ["ai", ["EY"]],
  ["ay", ["EY"]],
  ["oa", ["OW"]],
  ["ow", ["AW"]],
  ["oy", ["OY"]],
  ["oi", ["OY"]],
  ["au", ["AO"]],
  ["aw", ["AO"]],
  ["er", ["ER"]],
  ["ir", ["ER"]],
  ["ur", ["ER"]],
  ["ar", ["AA", "R"]],
  ["or", ["AO", "R"]],
];

const LETTER_PHONEMES: Record<string, string[]> = {
  a: ["AE"],
  b: ["B"],
  c: ["K"],
  d: ["D"],
  e: ["EH"],
  f: ["F"],
  g: ["G"],
  h: ["HH"],
  i: ["IH"],
  j: ["JH"],
  k: ["K"],
  l: ["L"],
  m: ["M"],
  n: ["N"],
  o: ["AA"],
  p: ["P"],
  q: ["K"],
  r: ["R"],
  s: ["S"],
  t: ["T"],
  u: ["AH"],
  v: ["V"],
  w: ["W"],
  x: ["K", "S"],
  y: ["Y"],
  z: ["Z"],
};

const COMMON_ENGLISH_WORDS = new Set([
  "a",
  "about",
  "and",
  "are",
  "as",
  "at",
  "be",
  "because",
  "but",
  "can",
  "for",
  "from",
  "have",
  "he",
  "i",
  "in",
  "is",
  "it",
  "not",
  "of",
  "on",
  "or",
  "our",
  "she",
  "so",
  "that",
  "the",
  "their",
  "there",
  "they",
  "this",
  "to",
  "was",
  "we",
  "were",
  "with",
  "you",
  "your",
]);

export function normalizeWord(word: string) {
  return word
    .toLowerCase()
    .replace(/[^\p{L}'-]+/gu, "")
    .replace(/^['-]+|['-]+$/g, "");
}

export function tokenizeWords(text: string) {
  return text
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean);
}

export function displayTokens(text: string) {
  return text
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function isDictionaryWord(word: string) {
  const normalized = normalizeWord(word);
  return Boolean(dictionary[normalized] || COMMON_ENGLISH_WORDS.has(normalized));
}

export function isLikelyEnglishTranscript(text: string, language?: string) {
  if (language && !/^en(g(lish)?)?$/i.test(language)) {
    return false;
  }

  const words = tokenizeWords(text);
  if (words.length < 3) {
    return false;
  }

  const latinWords = words.filter((word) => /^[a-z'-]+$/i.test(word)).length;
  const knownWords = words.filter(isDictionaryWord).length;
  const commonWords = words.filter((word) => COMMON_ENGLISH_WORDS.has(word)).length;
  const knownRatio = knownWords / words.length;
  const latinRatio = latinWords / words.length;

  return latinRatio >= 0.85 && (knownRatio >= 0.35 || commonWords >= 2);
}

export function pronunciationsForWord(word: string) {
  const normalized = normalizeWord(word);
  if (!normalized) {
    return [[]];
  }

  const pronunciations = new Set<string>();
  const direct = dictionary[normalized];

  if (direct) {
    pronunciations.add(cleanPronunciation(direct).join(" "));
  }

  for (let index = 1; index <= 4; index += 1) {
    const alternate = dictionary[`${normalized}(${index})`];
    if (alternate) {
      pronunciations.add(cleanPronunciation(alternate).join(" "));
    }
  }

  if (pronunciations.size === 0) {
    pronunciations.add(graphemeFallback(normalized).join(" "));
  }

  return [...pronunciations].map((pronunciation) => pronunciation.split(" "));
}

export function phonemesForWord(word: string) {
  return pronunciationsForWord(word)[0] ?? [];
}

export function phonemeSimilarity(expectedWord: string, actualWord: string) {
  const expectedPronunciations = pronunciationsForWord(expectedWord);
  const actualPronunciations = pronunciationsForWord(actualWord);
  let bestScore = 0;
  let bestExpected: string[] = [];
  let bestActual: string[] = [];

  for (const expected of expectedPronunciations) {
    for (const actual of actualPronunciations) {
      const maxLength = Math.max(expected.length, actual.length, 1);
      const distance = levenshtein(expected, actual);
      const score = Math.max(0, 1 - distance / maxLength);

      if (score > bestScore) {
        bestScore = score;
        bestExpected = expected;
        bestActual = actual;
      }
    }
  }

  return {
    score: bestScore,
    expectedPhonemes: bestExpected,
    actualPhonemes: bestActual,
  };
}

export function levenshtein<T>(left: T[], right: T[]) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array.from({ length: right.length + 1 }, () => 0);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost =
        left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;

      current[rightIndex] = Math.min(
        previous[rightIndex] + 1,
        current[rightIndex - 1] + 1,
        previous[rightIndex - 1] + substitutionCost,
      );
    }

    for (let index = 0; index <= right.length; index += 1) {
      previous[index] = current[index];
    }
  }

  return previous[right.length] ?? 0;
}

function cleanPronunciation(value: string) {
  return value.split(/\s+/).map((phoneme) => phoneme.replace(/\d/g, ""));
}

function graphemeFallback(word: string) {
  const phonemes: string[] = [];
  let index = 0;

  while (index < word.length) {
    const match = DIGRAPH_PHONEMES.find(([pattern]) =>
      word.startsWith(pattern, index),
    );

    if (match) {
      phonemes.push(...match[1]);
      index += match[0].length;
      continue;
    }

    const char = word[index];
    if (char && LETTER_PHONEMES[char]) {
      phonemes.push(...LETTER_PHONEMES[char]);
    }

    index += 1;
  }

  return phonemes.length > 0 ? phonemes : [word.toUpperCase()];
}
