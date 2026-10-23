"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Download, ExternalLink, Lock, ShieldCheck, Terminal } from "lucide-react";
import { Badge, ButtonLink, Card } from "./ui";
import { useSession } from "./session-provider";
import { humanSha, type AssetManifest } from "@/lib/manifest";
import { LINKS, REQUIREMENTS } from "@/lib/config";

export function DownloadPanel({
  manifest,
  compact = false,
}: {
  manifest: AssetManifest;
  compact?: boolean;
}) {
  const { user, loading } = useSession();
  const [copied, setCopied] = useState(false);

  const url = manifest.bundled ? `/downloads/${manifest.filename}` : manifest.mirrors[0];

  async function copyHash() {
    if (!manifest.sha256) return;
    try {
      await navigator.clipboard.writeText(manifest.sha256);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the hash is on screen anyway */
    }
  }

  return (
    <Card className={compact ? "overflow-hidden" : "overflow-hidden p-0"}>
      <div className="relative border-b border-white/[0.07] bg-gradient-to-br from-brand-600/[0.14] via-panel/40 to-transparent p-5 sm:p-6">
        <div aria-hidden className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="mint">
                <ShieldCheck className="size-3" />
                Signed build pipeline
              </Badge>
              <Badge tone="brand">v{manifest.version}</Badge>
              <Badge tone="neutral">Apache-2.0</Badge>
            </div>
            <h3 className="mt-3 font-mono text-lg font-semibold text-white sm:text-xl">
              {manifest.filename}
            </h3>
            <p className="mt-1 text-[0.83rem] text-slate-400">
              {manifest.sizeLabel ?? "—"} · Windows 10/11 x64 · self-contained, no runtime needed
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className="grid size-14 place-items-center rounded-2xl border border-brand-400/25 bg-brand-400/[0.08] text-brand-300">
              <svg viewBox="0 0 24 24" fill="none" className="size-7" aria-hidden>
                <path
                  d="M12 2.6 4.6 5.5v6.1c0 4.5 3.1 8.4 7.4 9.8 4.3-1.4 7.4-5.3 7.4-9.8V5.5L12 2.6Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="m8.9 12.1 2.2 2.2 4.1-4.4"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="font-mono text-[0.62rem] text-slate-600">PE32+ · UAC admin</span>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {loading ? (
          <div className="h-28 animate-pulse rounded-xl bg-white/[0.04]" />
        ) : user ? (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={url}
                download={manifest.filename}
                className="group inline-flex h-13 flex-1 items-center justify-center gap-2.5 rounded-xl bg-gradient-to-b from-brand-400 to-brand-600 px-6 py-3.5 text-[0.95rem] font-semibold text-void shadow-[0_10px_36px_-10px_rgba(34,211,238,.8)] transition-all duration-150 hover:from-brand-300 hover:to-brand-500 active:translate-y-px sm:flex-none"
              >
                <Download className="size-[18px] transition-transform group-hover:translate-y-0.5" strokeWidth={2.4} />
                Download {manifest.filename}
              </a>

              <a
                href={LINKS.releases}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3.5 text-[0.85rem] text-slate-300 transition-colors hover:border-brand-400/40 hover:text-white"
              >
                <ExternalLink className="size-4" />
                GitHub releases
              </a>
            </div>

            {!manifest.bundled ? (
              <p className="rounded-lg border border-gold-400/25 bg-gold-400/[0.07] px-3 py-2 text-[0.78rem] text-gold-300">
                The installer was not bundled into this deployment, so the button streams it from
                the GitHub mirror instead. Commit <code className="font-mono">GembyAV.exe</code> at
                the repo root and redeploy to serve it from the CDN.
              </p>
            ) : null}

            {/* checksum */}
            <div className="rounded-xl border border-white/[0.07] bg-void/50 p-3.5">
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-1.5 text-[0.72rem] font-medium tracking-wide text-slate-400 uppercase">
                  <Terminal className="size-3.5 text-brand-400" />
                  SHA-256 checksum
                </p>
                <button
                  onClick={copyHash}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1 text-[0.72rem] text-slate-400 transition-colors hover:border-brand-400/40 hover:text-brand-300"
                >
                  {copied ? <Check className="size-3 text-mint-400" /> : <Copy className="size-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="mt-2 font-mono text-[0.72rem] leading-relaxed break-all text-brand-300/90">
                {manifest.sha256 ?? "unavailable"}
              </p>
              <p className="mt-2 font-mono text-[0.68rem] text-slate-600">
                PS&gt; Get-FileHash .\{manifest.filename} -Algorithm SHA256
              </p>
              <p className="mt-0.5 font-mono text-[0.68rem] text-slate-600">
                # expect {humanSha(manifest.sha256, 24)}
              </p>
            </div>

            <div className="rounded-xl border border-brand-400/20 bg-brand-400/[0.05] p-3.5">
              <p className="text-[0.8rem] leading-relaxed text-slate-300">
                <strong className="font-semibold text-brand-200">SmartScreen will warn you.</strong>{" "}
                The binary is not code-signed with a purchased certificate, so Windows labels it
                unknown. Click <em>More info → Run anyway</em>.{" "}
                <Link
                  href="/chat?q=smartscreen"
                  className="text-brand-300 underline decoration-brand-400/40 underline-offset-2 hover:text-brand-200"
                >
                  Ask the assistant
                </Link>{" "}
                if you want the details.
              </p>
            </div>
          </div>
        ) : (
          <LockedState />
        )}
      </div>

      {!compact ? (
        <div className="border-t border-white/[0.07] bg-abyss/40 px-5 py-4 sm:px-6">
          <p className="mb-2.5 text-[0.7rem] font-medium tracking-[0.14em] text-slate-500 uppercase">
            Requirements
          </p>
          <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {REQUIREMENTS.map((r) => (
              <div key={r.label} className="flex items-baseline gap-2 text-[0.8rem]">
                <dt className="shrink-0 text-slate-500">{r.label}</dt>
                <span className="h-px flex-1 bg-white/[0.06]" />
                <dd className="text-right text-slate-300">{r.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </Card>
  );
}

function LockedState() {
  return (
    <div className="py-2 text-center">
      <span className="relative mx-auto grid size-14 place-items-center">
        <span className="absolute inset-0 animate-pulse-ring rounded-2xl border border-brand-400/35" />
        <span className="grid size-14 place-items-center rounded-2xl border border-brand-400/25 bg-brand-400/[0.08] text-brand-300">
          <Lock className="size-6" />
        </span>
      </span>

      <h3 className="mt-4 text-lg font-semibold text-white">Sign in to download</h3>
      <p className="mx-auto mt-2 max-w-sm text-[0.85rem] leading-relaxed text-slate-400">
        The installer, its checksum and the support assistant are all behind a free account. No
        card, no trial clock, no telemetry — it just keeps the download out of scraper bots.
      </p>

      <div className="mt-5 flex flex-col justify-center gap-2.5 sm:flex-row">
        <ButtonLink href="/signup" size="lg">
          Create free account
        </ButtonLink>
        <ButtonLink href="/signin" variant="secondary" size="lg">
          I already have one
        </ButtonLink>
      </div>

      <p className="mt-4 text-[0.75rem] text-slate-600">
        Prefer to skip the portal? The binary is committed to the{" "}
        <a
          href={LINKS.repo}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-500 underline decoration-white/15 underline-offset-2 hover:text-brand-300"
        >
          public repository
        </a>{" "}
        under Apache-2.0.
      </p>
    </div>
  );
}
