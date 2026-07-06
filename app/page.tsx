import { AudioUploader } from "@/components/AudioUploader";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen text-stone-950">
      <section className="painted-landscape overflow-hidden px-4 pb-20 pt-5 sm:px-6 lg:px-8">
        <div className="relative z-10 mx-auto max-w-7xl">
          <nav className="mx-auto flex max-w-5xl items-center justify-between rounded-full border border-white/70 bg-white/55 px-4 py-3 text-sm shadow-sm backdrop-blur-md">
            <Link className="font-bold tracking-tight text-stone-950" href="/">
              ✶ DUNA
            </Link>
            <div className="hidden items-center gap-8 text-stone-700 md:flex">
              <a href="#product">Product</a>
              <Link href="/demo">Demo</Link>
              <a href="#privacy">Privacy</a>
              <a href="#results">Results</a>
            </div>
            <Link
              className="rounded-full bg-stone-950 px-4 py-2 text-xs font-semibold text-white shadow-sm"
              href="/demo"
            >
              Schedule a demo
            </Link>
          </nav>

          <div className="mx-auto flex min-h-[34rem] max-w-3xl flex-col items-center justify-end pb-6 pt-24 text-center">
            <h1 className="text-5xl font-semibold tracking-tight text-stone-950 sm:text-7xl">
              The new standard in pronunciation scoring
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-stone-700 sm:text-base">
              Upload, record, or run the live demo to verify STT integrations,
              phoneme alignment, deterministic scoring, and DPDP-conscious
              processing.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white shadow-sm"
                href="#product"
              >
                Get started
              </a>
              <Link
                className="rounded-full border border-stone-300 bg-white/70 px-5 py-3 text-sm font-semibold text-stone-900 shadow-sm backdrop-blur"
                href="/demo"
              >
                Run live API demo
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-4xl text-center">
            <p className="text-xs text-stone-500">
              Built for assessment-grade pronunciation evaluation
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm font-semibold tracking-wide text-stone-400">
              <span>MEWS</span>
              <span>SVEA</span>
              <span>PLAID</span>
              <span>moss</span>
              <span>bol.</span>
              <span>seQura</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
        <Stat value="10.6x" label="Faster assessment loop" />
        <Stat value="37%" label="Clearer learner feedback" />
        <Stat value="4.8x" label="Auditable scoring" />
      </section>

      <section
        className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8"
        id="product"
      >
        <div className="mb-8">
          <p className="text-sm text-stone-500">
            Designed to convert. Built to scale.
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            Test pronunciation from upload, recording, or included live demo
            audio.
          </h2>
        </div>
        <AudioUploader />
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold text-stone-950">{value}</p>
      <p className="mt-1 text-xs text-stone-500">{label}</p>
    </div>
  );
}
