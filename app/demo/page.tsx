import { DemoRunner } from "@/components/DemoRunner";
import { Footer } from "@/components/marketing/Footer";
import { Navbar } from "@/components/marketing/Navbar";

export default function DemoPage() {
  return (
    <main className="bg-noise min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <section className="border-b border-gray-200 px-5 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
            Live demo
          </p>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold tracking-[-0.06em] text-gray-950 sm:text-7xl">
            Verify every API in the pronunciation pipeline.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-gray-500">
            The console below uses bundled audio fixtures and real provider
            credentials from the deployment environment. No mocked responses.
          </p>
        </div>
      </section>
      <section className="px-5 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
        <DemoRunner />
        </div>
      </section>
      <Footer />
    </main>
  );
}
