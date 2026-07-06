# Pronunciation Scoring Assessment

A production-grade Next.js web app for deterministic English pronunciation
scoring. Learners upload a 30-45 second audio recording, provide the expected
passage, and receive an overall score, word-by-word highlights, and practical
segment feedback.

## Live deployment

The app is designed for Vercel deployment. Set at least one STT provider key in
the deployment environment:

- `GRADIUM_API_KEY` (preferred)
- `GROQ_API_KEY`
- `DEEPGRAM_API_KEY`
- `OPENAI_API_KEY`

## Features

- Browser drag-drop audio upload with client-side duration validation.
- Server-side audio MIME, size, and 30-45 second duration enforcement.
- STT provider abstraction with Gradium first and Groq, Deepgram, OpenAI
  fallbacks.
- Deterministic scoring based on phoneme match rate, word error rate, and STT
  confidence.
- CMU Pronouncing Dictionary phoneme conversion plus fallback grapheme mapping
  for uncommon words.
- Word-level highlighting for correct, mispronounced, unclear, missing, and
  extra words.
- DPDP-conscious consent notice and in-memory result retention with automatic
  deletion within 24 hours.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and upload a 30-45 second English speech sample.

## Production build

```bash
npm run lint
npm run build
```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `GRADIUM_API_KEY` | Preferred Gradium AI speech-to-text provider. |
| `GROQ_API_KEY` | Groq Whisper fallback with fast English transcription. |
| `DEEPGRAM_API_KEY` | Deepgram fallback with word timestamps and confidence. |
| `OPENAI_API_KEY` | OpenAI Whisper fallback. |

No database is required. Raw audio is never written to disk or persisted.

## Key files

```text
app/
  api/upload/route.ts
  page.tsx
components/
  AudioUploader.tsx
  ConsentBanner.tsx
  FeedbackPanel.tsx
  ScoreDisplay.tsx
lib/
  dpdp.ts
  phoneme.ts
  scoring.ts
  stt.ts
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for model choices, scoring details,
DPDP compliance notes, and trade-offs.
