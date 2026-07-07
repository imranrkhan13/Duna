# Pronunciation Scoring Architecture

## Component diagram

```text
Frontend (Next.js + Tailwind)
  -> API Route (/api/upload)
    -> STT Service (Gradium, fallback Groq/Deepgram/OpenAI)
      -> Phoneme Comparator (CMUdict + fallback grapheme mapper)
        -> Scoring Engine (deterministic alignment and scoring)
          -> JSON Response (score, word highlights, feedback)

Demo Frontend (/demo)
  -> API Route (/api/demo/verify)
    -> Public WAV fixtures
    -> Real Gradium/Groq/Deepgram API calls
    -> Production /api/upload self-checks
    -> Phoneme Comparator + Scoring Engine
    -> JSON Report (status, raw responses, latency, issues)
```

## Model and API choices

The app prefers **Gradium AI STT** because the assessment requested it and the
REST endpoint supports one-shot audio uploads with timestamped transcript
segments. Gradium currently documents segment timestamps for STT, so the app
derives word anchors evenly inside a segment when word-level timestamps are not
returned.

Fallback providers are ordered by practical production fit:

1. **Groq Whisper** (`whisper-large-v3-turbo`) for fast English transcription
   and OpenAI-compatible verbose JSON with word/segment timestamp options.
2. **Deepgram** (`nova-2`) for word timestamps and word confidence values.
3. **OpenAI Whisper** for broad compatibility.

Provider selection is environment-based. The API route tries configured
providers in order and returns a clear setup error if none are configured.
Both underscore and prompt-style variable names are supported, for example
`GRADIUM_API_KEY` and `GRADIUMAPIKEY`.

## Live demo verification

The landing page also includes a demo-first product tour using five bundled
recordings (`demo-excellent.wav`, `demo-good.wav`, `demo-average.wav`,
`demo-poor.wav`, and `demo-strong-accent.wav`). Those samples are prepackaged so
users can understand the upload -> speech recognition -> transcript -> phoneme
alignment -> scoring -> feedback flow immediately without supplying personal
audio.

The `/demo` route is intentionally not a mock. It calls
`/api/demo/verify`, which reads bundled spoken WAV fixtures from `public/` and
runs seven checks. The primary fixture,
`public/pronunciation-correction-demo.wav`, intentionally says "The quick brown
box jumps over the lazy log" while the expected passage is "The quick brown fox
jumps over the lazy dog"; configured STT providers therefore return real
transcripts that the phoneme/scoring layers can correct and highlight.

1. Gradium STT with automatic Groq fallback.
2. Direct Groq Whisper.
3. Direct Deepgram, skipped when no key is configured.
4. Phoneme alignment using the real transcript from test 1.
5. Deterministic scoring math using the real alignment.
6. DPDP upload/deletion audit through the production `/api/upload` endpoint.
7. Duration validation through `/api/upload` with 10s, 35s, and 60s fixtures.

Each card returns real response data, latency, status, and issues. Missing keys
are shown as skipped or failing configuration states rather than fabricated
success responses.

## Scoring methodology

Scores are deterministic and auditable; no LLM generates scores.

1. **Normalize and tokenize** the expected prompt and STT transcript into words.
2. **Convert words to phonemes** using the CMU Pronouncing Dictionary
   (ARPABET). For unknown words, a deterministic grapheme-to-phoneme fallback
   maps common English letter groups (`th`, `sh`, `tion`, `igh`, etc.) and
   single letters to approximate ARPABET symbols.
3. **Align words** with dynamic programming. Exact word matches cost `0`;
   substitutions with close phoneme similarity cost `0.55`; deletions and
   insertions cost `1`.
4. **Score each aligned word**:
   - Correct: exact or high phoneme match.
   - Mispronounced: expected and actual words align but phoneme similarity is
     low.
   - Unclear: phonemes match but STT confidence is low.
   - Missing: expected word is deleted in the alignment.
   - Extra: transcript word is inserted in the alignment.
5. **Overall score**:

```text
overall = 100 * (
  0.65 * phonemeMatchRate +
  0.25 * wordAccuracy +
  0.10 * sttConfidence
)
```

`wordAccuracy` is `1 - wordErrorRate`, where WER is Levenshtein edit distance
over normalized word tokens divided by expected word count. The final value is
clamped to `0-100` and rounded to an integer.

## DPDP compliance

- **Consent**: the upload flow shows the required notice before submission:
  "Your audio is processed temporarily and deleted within 24 hours. No data is
  stored permanently." The API also requires a consent flag.
- **Data minimization**: the app collects no name, email, account, IP-derived
  profile, or learner metadata beyond the audio upload and expected prompt.
- **Raw audio storage**: uploaded audio is read into memory for validation and
  STT submission only. It is never written to disk or a database by the app.
- **Retention**: scoring results and transcripts are stored only in an
  in-memory map with automatic deletion after 24 hours. Serverless restarts can
  delete them sooner.
- **Deletion**: automatic deletion is scheduled per result ID. No persistent
  copy exists for manual cleanup.
- **Cloud STT providers**: when a provider is configured, audio is transmitted
  to that provider solely for transcription. Production deployments should
  verify the provider's current API terms for retention guarantees; the app does
  not request training or long-term storage.
- **Data residency**: if a provider offers India/APAC processing, that region
  should be selected at the account/provider level. Gradium/Groq/OpenAI endpoint
  region controls may be limited, so this is documented as a trade-off. Deepgram
  can be configured separately if regional controls are required by policy.

## Duration and language constraints

The browser validates duration with media metadata before upload or after an
in-page `MediaRecorder` capture. The API route revalidates duration with
`music-metadata` and rejects files outside 30-45 seconds. English-only
enforcement uses provider language metadata when available and a deterministic
transcript heuristic based on Latin script and CMU/common English word coverage.

## Trade-offs and next improvements

- Vercel request body limits make compressed browser audio formats preferable
  to large WAV files. A larger production deployment could use direct-to-object
  temporary upload URLs with automatic object expiry, while still avoiding raw
  audio persistence beyond the retention window.
- Segment-only STT timestamps require derived word anchors for Gradium. With
  more time, the app would add a forced aligner such as Montreal Forced Aligner
  or a provider with native word timestamps for every request.
- The phoneme fallback is intentionally deterministic and lightweight. A
  production learner app could add accent-aware phoneme alternatives and
  curriculum-specific rubrics without changing the auditable scoring contract.
- Real user management is omitted to minimize personal data collection. If
  accounts were added, consent records, deletion requests, and retention audits
  would need persistent DPDP controls.
