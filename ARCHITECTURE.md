# DUNA Pronunciation Assessment Platform

> Deterministic, explainable, and privacy-conscious pronunciation assessment for education and language learning.

---

# What This Is

DUNA helps learners improve their English pronunciation by comparing spoken audio against an expected passage and providing word-level feedback.

Instead of generating subjective AI opinions, DUNA uses deterministic speech alignment and phoneme comparison so every score can be reproduced and explained.

The platform is designed for:

- Language learning platforms
- Educational institutions
- English proficiency practice
- Assessment workflows

---

# What This Is Not

DUNA is **not** a clinical speech pathology tool.

It is designed as an educational pronunciation assessment platform that helps learners identify pronunciation patterns and practice more effectively.

---

# Core Design Principles

The architecture was built around five principles.

## 1. Deterministic Scoring

Speech recognition may use AI.

Pronunciation scoring does not.

The same recording always produces the same score.

---

## 2. Explainability

Every pronunciation decision can be explained.

For every highlighted word the system knows:

- expected word
- detected word
- expected phonemes
- detected phonemes
- confidence
- scoring reason

No black-box score exists.

---

## 3. Privacy First

Only information required for pronunciation assessment is processed.

Raw audio is never intentionally stored permanently.

Temporary assessment data is automatically removed after 24 hours.

---

## 4. Provider Independence

Speech recognition providers evolve quickly.

The pronunciation engine is completely independent from the STT provider.

Replacing Gradium with another provider requires no scoring changes.

---

## 5. Auditability

Every assessment includes:

- transcript
- phoneme alignment
- score calculation
- confidence values
- reasoning

This makes results suitable for educational review and debugging.

---

# High-Level Architecture

```text
Browser (Next.js)

        │

Upload / Recording

        │

        ▼

API (/api/upload)

        │

Duration Validation
Consent Validation

        │

        ▼

Speech-to-Text Layer

Gradium
↓

Groq Whisper
↓

Deepgram
↓

OpenAI Whisper

        │

        ▼

Transcript

        │

        ▼

Phoneme Normalization

        │

        ▼

Dynamic Programming Alignment

        │

        ▼

Deterministic Scoring Engine

        │

        ▼

Assessment Report

        │

        ▼

Temporary Result Store
```

---

# How It Works

## Step 1

The learner records or uploads English speech.

---

## Step 2

The application validates:

- file format
- duration
- consent

---

## Step 3

Audio is sent to the configured Speech-to-Text provider.

The provider returns:

- transcript
- timestamps
- confidence

---

## Step 4

Both the expected passage and transcript are normalized.

Examples:

- lowercase conversion
- punctuation removal
- whitespace normalization

---

## Step 5

Words are converted into phonemes using:

Primary:

- CMU Pronouncing Dictionary

Fallback:

- deterministic grapheme-to-phoneme mapping

---

## Step 6

Expected words and detected words are aligned using dynamic programming.

Each word becomes one of:

- Correct
- Mispronounced
- Missing
- Extra
- Unclear

---

## Step 7

The final pronunciation score is calculated using deterministic mathematics.

No LLM generates scores.

---

# Speech Recognition Strategy

Primary Provider

- Gradium AI

Fallback Providers

1. Groq Whisper
2. Deepgram Nova
3. OpenAI Whisper

Provider selection is environment driven.

The API automatically falls back to the next configured provider if one fails.

This improves reliability while keeping downstream scoring identical.

---

# Scoring Methodology

Scoring consists of four stages.

## Word Accuracy

Expected words are compared against detected words.

Word Error Rate (WER) is calculated using Levenshtein distance.

---

## Phoneme Matching

Words are converted into ARPABET phonemes.

Unknown words use deterministic grapheme mapping.

---

## Dynamic Alignment

Word alignment minimizes insertion, deletion, and substitution costs.

Exact matches cost 0.

Substitutions receive weighted penalties based on phoneme similarity.

---

## Overall Score

```text
Overall Score =
100 × (

0.65 × Phoneme Match

+ 0.25 × Word Accuracy

+ 0.10 × STT Confidence

)
```

The result is clamped between 0–100.

---

# Example Feedback

Expected

```
pronunciation
```

Detected

```
pronounciation
```

Reason

```
Vowel substitution
```

Confidence

```
94%
```

Recommendation

```
Shorten the vowel sound.

Reduce emphasis on "OW".

Aim for the "AH" vowel.
```

---

# Live Demo Verification

The demo does not simulate results.

Running `/demo` performs real verification against the production pipeline.

Checks include:

- Provider connectivity
- STT accuracy
- Latency
- Phoneme alignment
- Deterministic scoring
- Duration validation
- Upload pipeline
- DPDP workflow

Missing API keys are reported honestly rather than hidden behind mocked success responses.

---

# Privacy & DPDP Considerations

The platform follows a privacy-by-design approach.

Implemented safeguards include:

- explicit user consent
- temporary in-memory processing
- automatic deletion within 24 hours
- no permanent raw audio storage
- minimal personal data collection
- provider disclosure before transcription

Audio transmitted to third-party STT providers is used only for transcription. Data handling and retention by those providers are governed by their respective privacy policies and service terms.

---

# Trade-offs

Current implementation intentionally favors transparency over complexity.

Examples:

- Segment-derived timestamps when native word timing is unavailable
- Lightweight deterministic grapheme mapping
- In-memory storage instead of persistent databases
- English-only support

---

# Future Improvements

Potential production enhancements include:

- multilingual pronunciation assessment
- accent-aware phoneme alternatives
- forced alignment (Montreal Forced Aligner)
- learner progress tracking
- institution-specific scoring rubrics
- temporary object-storage uploads for large files
- statistical validation against human raters

The deterministic scoring contract remains unchanged regardless of future improvements.

---

# Key Engineering Decisions

- Deterministic scoring over LLM scoring
- Provider abstraction over vendor lock-in
- Explainability over opaque AI outputs
- Privacy-first temporary processing
- Auditable calculations suitable for educational assessment

---

## Summary

DUNA separates **speech recognition** from **pronunciation assessment**.

Speech recognition may vary between providers.

Scoring does not.

Every pronunciation decision is reproducible, explainable, and based on deterministic algorithms, making the platform suitable for educational feedback and assessment workflows while remaining privacy-conscious and provider independent.
