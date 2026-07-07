"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navItems = [
  { label: "Product", href: "/#product" },
  { label: "API", href: "/demo" },
  { label: "Demo", href: "/demo" },
  { label: "Docs", href: "/#docs" },
  { label: "Pricing", href: "/#pricing" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-gray-200/70 bg-[#FAFAFA]/80 backdrop-blur-xl">
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8"
      >
        <Link
          className="flex items-center gap-2 text-sm font-semibold tracking-[-0.02em] text-gray-950"
          href="/"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gray-950 text-xs text-white">
            D
          </span>
          DUNA
        </Link>

        <div className="hidden items-center gap-7 text-sm text-gray-500 lg:flex">
          {navItems.map((item) => (
            <Link
              className="transition hover:text-gray-950"
              href={item.href}
              key={item.label}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <Link
          className="hidden h-11 items-center rounded-full bg-blue-600 px-5 text-sm font-medium text-white shadow-[0_10px_30px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:bg-blue-500 active:translate-y-0 sm:inline-flex"
          href="/#live-demo"
        >
          Run Live Demo
        </Link>

        <button
          aria-expanded={isOpen}
          aria-label="Toggle navigation menu"
          className="grid h-10 w-10 place-items-center rounded-full border border-gray-200 bg-white text-gray-700 lg:hidden"
          type="button"
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </nav>

      {isOpen ? (
        <div className="border-t border-gray-200 bg-[#FAFAFA] px-5 py-4 lg:hidden">
          <div className="grid gap-2">
            {navItems.map((item) => (
              <Link
                className="rounded-2xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-white"
                href={item.href}
                key={item.label}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-blue-600 px-5 text-sm font-medium text-white"
              href="/#live-demo"
              onClick={() => setIsOpen(false)}
            >
              Run Live Demo
            </Link>
          </div>
        </div>
      ) : null}
    </header>

    <Link
      className="fixed bottom-4 left-4 right-4 z-40 inline-flex h-12 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white shadow-[0_18px_50px_rgba(37,99,235,0.28)] sm:hidden"
      href="/#live-demo"
    >
      Run Live Demo
    </Link>
    </>
  );
}
