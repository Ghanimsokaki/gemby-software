import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Bot, Download, GithubIcon, Logo, MessageSquare, ShieldCheck } from "./ui-bridge";
import { LINKS, PRODUCT } from "@/lib/config";
import { getManifest } from "@/lib/manifest";

const PERKS = [
  {
    icon: Download,
    title: "The installer, straight from the CDN",
    body: `${PRODUCT.name}.exe served from the edge, with its SHA-256 published so you can verify the bytes you received.`,
  },
  {
    icon: MessageSquare,
    title: "A support assistant that read the source",
    body: "Ask about SmartScreen, false positives, YARA rules or quarantine and get answers grounded in the real engine.",
  },
  {
    icon: ShieldCheck,
    title: "Checksums, requirements and release notes",
    body: "Everything you need before you run an unsigned binary on a machine you care about.",
  },
];

export function AuthShell({
  mode,
  children,
}: {
  mode: "signin" | "signup";
  children: ReactNode;
}) {
  const manifest = getManifest();

  return (
    <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-6xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-16">
      {/* ------------------------------------------------------------- form */}
      <div className="flex justify-center lg:justify-end">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 inline-flex items-center gap-2.5 lg:hidden">
            <Logo className="size-8" />
            <span className="text-[1.02rem] font-bold tracking-tight text-white">
              Gemby<span className="text-brand-400">AV</span>
            </span>
          </Link>
          {children}
        </div>
      </div>

      {/* --------------------------------------------------------- showcase */}
      <div className="relative hidden lg:block">
        <div
          aria-hidden
          className="absolute -inset-10 rounded-[2.5rem] bg-gradient-to-br from-brand-600/[0.14] via-transparent to-mint-500/[0.09] blur-2xl"
        />

        <div className="relative">
          <Link href="/" className="mb-9 inline-flex items-center gap-2.5">
            <Logo className="size-9" />
            <span className="text-[1.1rem] font-bold tracking-tight text-white">
              Gemby<span className="text-brand-400">AV</span>
            </span>
          </Link>

          <h2 className="text-3xl font-bold tracking-tight text-balance text-white">
            {mode === "signup"
              ? "One account. The binary, the checksums and the assistant."
              : "Pick up where you left off."}
          </h2>
          <p className="mt-3.5 max-w-md text-[0.95rem] leading-relaxed text-slate-400">
            Six detection layers, one readable Python file, Apache-2.0 licensed. Nothing to pay
            for and nothing phoning home.
          </p>

          <ul className="mt-9 space-y-4">
            {PERKS.map((p) => (
              <li key={p.title} className="flex gap-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-brand-400/25 bg-brand-400/[0.08] text-brand-300">
                  <p.icon className="size-[18px]" strokeWidth={1.9} />
                </span>
                <div>
                  <p className="text-[0.92rem] font-medium text-white">{p.title}</p>
                  <p className="mt-1 text-[0.83rem] leading-relaxed text-slate-500">{p.body}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* release card */}
          <div className="mt-9 overflow-hidden rounded-2xl border border-white/[0.08] bg-panel/50 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-2.5">
              <span className="flex items-center gap-2 font-mono text-[0.72rem] text-slate-400">
                <Bot className="size-3.5 text-brand-400" />
                latest build
              </span>
              <span className="font-mono text-[0.7rem] text-brand-400">v{manifest.version}</span>
            </div>
            <dl className="grid grid-cols-3 gap-px bg-white/[0.06]">
              {[
                ["File", manifest.filename],
                ["Size", manifest.sizeLabel ?? "—"],
                ["Licence", PRODUCT.license],
              ].map(([k, v]) => (
                <div key={k} className="bg-panel/80 px-3.5 py-3">
                  <dt className="text-[0.66rem] tracking-wide text-slate-500 uppercase">{k}</dt>
                  <dd className="mt-1 truncate font-mono text-[0.78rem] text-slate-200">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <code className="truncate font-mono text-[0.68rem] text-slate-500">
                sha256:{manifest.sha256?.slice(0, 26)}…
              </code>
              <a
                href={LINKS.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="flex shrink-0 items-center gap-1.5 text-[0.75rem] text-slate-400 transition-colors hover:text-brand-300"
              >
                <GithubIcon className="size-3.5" />
                Source
                <ArrowRight className="size-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
