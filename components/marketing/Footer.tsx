import Link from "next/link";

const columns = [
  {
    title: "Product",
    links: ["API", "Docs", "Pricing", "Status"],
  },
  {
    title: "Company",
    links: ["Privacy", "Terms", "GitHub", "LinkedIn"],
  },
  {
    title: "Assessment",
    links: ["Live demo", "Scoring", "Alignment", "DPDP"],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-6 md:grid-cols-[1.4fr_2fr] lg:px-8">
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
            Deterministic pronunciation assessment for modern education and
            language learning platforms.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-gray-950">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-500">
                {column.links.map((link) => (
                  <li key={link}>
                    <Link
                      className="transition hover:text-gray-950"
                      href={link === "Live demo" ? "/demo" : "/#product"}
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
