import { AudioUploader } from "@/components/AudioUploader";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white/85 p-8 shadow-sm backdrop-blur">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">
            SWE assessment
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">
            Pronunciation scoring for English learners
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Upload a 30-45 second recording, compare it against the expected
            passage, and receive deterministic word-level pronunciation feedback
            built from speech-to-text, phoneme alignment, and auditable scoring.
          </p>
        </div>
      </section>

      <AudioUploader />
    </main>
  );
}
