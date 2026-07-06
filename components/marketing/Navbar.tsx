import Link from "next/link";

const navItems = [
  { label: "Product", href: "/#product" },
  { label: "API", href: "/demo" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Privacy", href: "/#privacy" },
  { label: "Docs", href: "/#docs" },
  { label: "Demo", href: "/demo" },
  { label: "Schedule Demo", href: "/demo" },
];

export function Navbar() {
  return (
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
          className="inline-flex h-11 items-center rounded-full bg-blue-600 px-5 text-sm font-medium text-white shadow-[0_10px_30px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:bg-blue-500 active:translate-y-0"
          href="#product"
        >
          Get Started
        </Link>
      </nav>
    </header>
  );
}
