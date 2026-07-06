import Link from "next/link";

import { DemoRunner } from "@/components/DemoRunner";

export default function DemoPage() {
  return (
    <main className="min-h-screen px-4 py-6 text-stone-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-6 flex items-center justify-between rounded-full border border-white/70 bg-white/70 px-5 py-3 shadow-sm backdrop-blur">
          <Link className="text-sm font-bold tracking-tight" href="/">
            ✶ DUNA
          </Link>
          <div className="flex items-center gap-4 text-sm text-stone-600">
            <Link className="hover:text-stone-950" href="/">
              Product
            </Link>
            <Link className="hover:text-stone-950" href="/demo">
              Live demo
            </Link>
          </div>
        </nav>

        <DemoRunner />
      </div>
    </main>
  );
}
