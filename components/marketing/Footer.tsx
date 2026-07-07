import Link from "next/link";

const links = ["Product", "API", "Docs", "Pricing", "Privacy", "Terms"];

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-12 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <Link
            className="flex items-center gap-2 text-sm font-semibold text-gray-950"
            href="/"
          >
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gray-950 text-xs text-white">
              D
            </span>
            DUNA
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-gray-500">
            AI Pronunciation Assessment
          </p>
        </div>

        <div className="flex flex-col gap-5 md:items-end">
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-500">
            {links.map((link) => (
              <Link
                className="transition hover:text-gray-950"
                href={["API", "Docs"].includes(link) ? "/demo" : "/#product"}
                key={link}
              >
                {link}
              </Link>
            ))}
          </div>
          <p className="text-sm text-gray-400">© 2026 DUNA</p>
        </div>
      </div>
    </footer>
  );
}
