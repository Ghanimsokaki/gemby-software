import Link from "next/link";
import { GithubIcon, Logo } from "./ui";
import { LINKS, PRODUCT, UPDATE_ENDPOINTS } from "@/lib/config";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Detection pipeline", href: "/#detection" },
      { label: "Download", href: "/download" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/signin" },
      { label: "Create account", href: "/signup" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Support assistant", href: "/chat" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Source code", href: LINKS.source },
      { label: "Releases", href: LINKS.releases },
      { label: "Report an issue", href: LINKS.issues },
      { label: "Apache-2.0 licence", href: LINKS.license },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-white/[0.07] bg-abyss/60">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-2.5">
              <Logo className="size-8" />
              <span className="text-[1.02rem] font-bold tracking-tight text-white">
                Gemby<span className="text-brand-400">AV</span>
              </span>
            </div>
            <p className="mt-3.5 max-w-xs text-[0.85rem] leading-relaxed text-slate-500">
              A free, open-source multi-layer antivirus for Windows. Six detection engines, one
              honest risk score, no telemetry.
            </p>

            <div className="mt-5 flex items-center gap-2">
              <a
                href={LINKS.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[0.78rem] text-slate-400 transition-colors hover:border-brand-400/40 hover:text-brand-300"
              >
                <GithubIcon className="size-4" />
                {PRODUCT.repo}
              </a>
            </div>

            <div className="mt-4 rounded-lg border border-white/[0.07] bg-panel/50 px-3 py-2.5">
              <p className="font-mono text-[0.68rem] text-slate-500">
                <span className="text-slate-400">UPDATE_URL</span>{" "}
                <Link
                  href={UPDATE_ENDPOINTS.site}
                  className="text-brand-400/80 underline decoration-brand-400/30 underline-offset-2 hover:text-brand-300"
                >
                  {UPDATE_ENDPOINTS.site}
                </Link>
              </p>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-[0.72rem] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                {col.title}
              </h3>
              <ul className="mt-3.5 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith("http") ? (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[0.85rem] text-slate-400 transition-colors hover:text-brand-300"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link
                        href={l.href}
                        className="text-[0.85rem] text-slate-400 transition-colors hover:text-brand-300"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/[0.07] pt-6 text-[0.78rem] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {PRODUCT.name}. Released under the Apache License 2.0.
          </p>
          <p className="max-w-md sm:text-right">
            Not a certified security product. Always verify checksums and keep a signed,
            always-on antivirus as your primary defence.
          </p>
        </div>
      </div>
    </footer>
  );
}
