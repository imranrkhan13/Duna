# Pronunciation Scoring Assessment

A production-grade Next.js web app for deterministic English pronunciation
scoring. Learners upload a 30-45 second audio recording, provide the expected
passage, and receive an overall score, word-by-word highlights, and practical
segment feedback.

## Live deployment

The app is designed for Vercel deployment. This repository includes
`vercel.json` with 60 second function timeouts for `/api/upload` and
`/api/demo/verify`.

Set at least one STT provider key in the deployment environment:

- `GRADIUM_API_KEY` or `GRADIUMAPIKEY` (preferred)
- `GROQ_API_KEY` or `GROQAPIKEY`
- `DEEPGRAM_API_KEY` or `DEEPGRAMAPIKEY`
- `OPENAI_API_KEY` or `OPENAIAPIKEY`

Then deploy:

```bash
npx vercel deploy --prod --yes
```

## Features

- Browser drag-drop audio upload and primary in-page microphone recording with
  client-side duration validation. Recordings are attached and scored
  automatically after stopping.
- `/demo` route that runs real API verification cards using bundled public WAV
  fixtures and live provider calls.
- Built-in pronunciation correction fixture that intentionally says "box/log"
  while the expected passage says "fox/dog", so configured STT providers show
  real transcripts and the scoring engine highlights pronunciation issues.
- Demo-first landing experience with five bundled recordings: Excellent, Good,
  Average, Poor, and Strong accent. Each sample includes audio, transcript,
  word-level feedback, and a final score without requiring upload.
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

Open `http://localhost:3000` and upload or record a 30-45 second English speech
sample. Open `http://localhost:3000/demo` to run the no-upload live API demo.

## Production build

```bash
npm run lint
npm run build
```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `GRADIUM_API_KEY` | Preferred Gradium AI speech-to-text provider. |
| `GRADIUMAPIKEY` | Alternate Gradium key name supported by the demo prompt. |
| `GROQ_API_KEY` | Groq Whisper fallback with fast English transcription. |
| `GROQAPIKEY` | Alternate Groq key name. |
| `DEEPGRAM_API_KEY` | Deepgram fallback with word timestamps and confidence. |
| `DEEPGRAMAPIKEY` | Alternate Deepgram key name. |
| `OPENAI_API_KEY` | OpenAI Whisper fallback. |
| `OPENAIAPIKEY` | Alternate OpenAI key name. |

No database is required. Raw audio is never written to disk or persisted.

## Key files

```text
app/
  api/demo/verify/route.ts
  api/upload/route.ts
  demo/page.tsx
  page.tsx
components/
  AudioUploader.tsx
  ConsentBanner.tsx
  DemoRunner.tsx
  FeedbackPanel.tsx
  ScoreDisplay.tsx
lib/
  demoTypes.ts
  dpdp.ts
  phoneme.ts
  scoring.ts
  stt.ts
public/
  demo-excellent.wav
  demo-good.wav
  demo-average.wav
  demo-poor.wav
  demo-strong-accent.wav
  pronunciation-correction-demo.wav
  test-audio.wav
  too-short-0-5s.wav
  too-short-10s.wav
  valid-35s.wav
  too-long-60s.wav
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for model choices, scoring details,
DPDP compliance notes, and trade-offs.
