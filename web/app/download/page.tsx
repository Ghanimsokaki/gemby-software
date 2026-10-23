import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Download,
  ExternalLink,
  FileCode2,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { readSession } from "@/lib/auth/session";
import { DownloadPanel } from "@/components/download-panel";
import { Badge, ButtonLink, Card, GithubIcon } from "@/components/ui";
import { LINKS, PRODUCT, UPDATE_ENDPOINTS } from "@/lib/config";
import { getManifest } from "@/lib/manifest";

export const metadata: Metadata = {
  title: "Download",
  description: `Download ${PRODUCT.name}.exe and verify its SHA-256 checksum.`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DownloadPage() {
  const session = await readSession();
  if (!session) redirect("/signin?next=/download&reason=auth");

  const manifest = getManifest();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
      <header className="animate-rise">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">
            <Download className="size-3" />
            Installer
          </Badge>
          <Badge tone="neutral">v{manifest.version}</Badge>
          <Badge tone="neutral">{manifest.sizeLabel}</Badge>
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance text-white sm:text-[2.6rem]">
          Download {PRODUCT.name}
        </h1>
        <p className="mt-3 max-w-2xl text-[0.98rem] leading-relaxed text-slate-400">
          A single self-contained Windows executable. Python, <code className="font-mono text-[0.88rem] text-brand-300">pefile</code>,{" "}
          <code className="font-mono text-[0.88rem] text-brand-300">yara-python</code> and{" "}
          <code className="font-mono text-[0.88rem] text-brand-300">watchdog</code> are bundled in —
          there is nothing else to install and nothing to activate.
        </p>
      </header>

      <div className="mt-9 animate-rise" style={{ animationDelay: "70ms" }}>
        <DownloadPanel manifest={manifest} />
      </div>

      {/* --------------------------------------------------- verification */}
      <section id="checksum" className="mt-14 scroll-mt-24">
        <h2 className="flex items-center gap-2.5 text-xl font-semibold text-white">
          <Terminal className="size-5 text-brand-400" />
          Verify before you run it
        </h2>
        <p className="mt-2.5 max-w-2xl text-[0.9rem] leading-relaxed text-slate-400">
          The binary is not code-signed, so Windows cannot vouch for it. You can — a SHA-256 match
          proves the file you hold is byte-identical to the one the build pipeline produced.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <p className="text-[0.78rem] font-medium tracking-wide text-slate-400 uppercase">
              Windows PowerShell
            </p>
            <pre className="mt-3 overflow-x-auto rounded-xl border border-white/[0.07] bg-void/70 p-3.5 font-mono text-[0.76rem] leading-relaxed text-slate-300">
              <code>{`Get-FileHash .\\${manifest.filename} -Algorithm SHA256 | Format-List`}</code>
            </pre>
            <p className="mt-3 text-[0.78rem] font-medium tracking-wide text-slate-400 uppercase">
              Windows cmd (certutil)
            </p>
            <pre className="mt-3 overflow-x-auto rounded-xl border border-white/[0.07] bg-void/70 p-3.5 font-mono text-[0.76rem] leading-relaxed text-slate-300">
              <code>{`certutil -hashfile ${manifest.filename} SHA256`}</code>
            </pre>
          </Card>

          <Card className="p-5">
            <p className="text-[0.78rem] font-medium tracking-wide text-slate-400 uppercase">
              Expected digest
            </p>
            <p className="mt-3 rounded-xl border border-brand-400/20 bg-brand-400/[0.05] p-3.5 font-mono text-[0.74rem] leading-relaxed break-all text-brand-200">
              {manifest.sha256 ?? "unavailable"}
            </p>
            <ul className="mt-4 space-y-2">
              {[
                "Case-insensitive — compare all 64 hex characters",
                "A mismatch means a truncated or tampered transfer: delete and re-download",
                "This digest is recomputed from the binary on every deploy",
              ].map((t) => (
                <li key={t} className="flex gap-2.5 text-[0.82rem] leading-relaxed text-slate-400">
                  <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-mint-400" />
                  {t}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card className="mt-4 flex items-start gap-3.5 border-gold-400/25 bg-gold-400/[0.05] p-5">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-gold-400" />
          <div>
            <p className="text-[0.92rem] font-semibold text-white">
              SmartScreen will say “Windows protected your PC”
            </p>
            <p className="mt-1.5 text-[0.85rem] leading-relaxed text-slate-400">
              That is a reputation warning about an unsigned binary, not a malware detection. Click{" "}
              <strong className="font-medium text-slate-200">More info</strong> then{" "}
              <strong className="font-medium text-slate-200">Run anyway</strong>. If your browser
              blocked the download, keep the file from the Downloads shelf.{" "}
              <Link
                href="/chat?q=smartscreen"
                className="text-brand-300 underline decoration-brand-400/40 underline-offset-2 hover:text-brand-200"
              >
                Ask the assistant for the full explanation
              </Link>
              .
            </p>
          </div>
        </Card>
      </section>

      {/* --------------------------------------------------------- mirrors */}
      <section className="mt-14">
        <h2 className="flex items-center gap-2.5 text-xl font-semibold text-white">
          <ExternalLink className="size-5 text-brand-400" />
          Mirrors & build provenance
        </h2>

        <Card className="mt-6 overflow-hidden">
          <div className="divide-y divide-white/[0.06]">
            {[
              {
                label: "This site (CDN)",
                href: manifest.bundled ? `/downloads/${manifest.filename}` : null,
                note: manifest.bundled
                  ? "Fastest option. Served from Vercel's edge, gated behind your session."
                  : "Not bundled into this deployment — use a mirror below.",
                active: manifest.bundled,
              },
              ...manifest.mirrors.map((m, i) => ({
                label: i === 0 ? "GitHub (repository blob)" : "GitHub (raw mirror)",
                href: m,
                note:
                  i === 0
                    ? "The exact file committed to main by the build workflow."
                    : "Direct raw.githubusercontent.com link for scripts and CI.",
                active: false,
              })),
              {
                label: "GitHub releases",
                href: LINKS.releases,
                note: "Tagged v* builds published by the same Actions workflow.",
                active: false,
              },
            ].map((m) => (
              <div
                key={m.label}
                className="flex flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-white/[0.02]"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-[0.9rem] font-medium text-white">
                    {m.label}
                    {m.active ? (
                      <span className="rounded-full border border-mint-400/25 bg-mint-400/10 px-2 py-px text-[0.62rem] font-medium text-mint-300">
                        recommended
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-[0.78rem] text-slate-500">{m.note}</p>
                  {m.href ? (
                    <code className="mt-1.5 block truncate font-mono text-[0.68rem] text-slate-600">
                      {m.href}
                    </code>
                  ) : null}
                </div>
                {m.href ? (
                  <a
                    href={m.href}
                    {...(m.href.startsWith("http")
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : { download: manifest.filename })}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-[0.78rem] text-slate-300 transition-colors hover:border-brand-400/40 hover:text-brand-300"
                  >
                    <Download className="size-3.5" />
                    Get file
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </Card>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card className="p-5">
            <p className="flex items-center gap-2 text-[0.9rem] font-semibold text-white">
              <FileCode2 className="size-4 text-brand-400" />
              How this binary is built
            </p>
            <p className="mt-2 text-[0.83rem] leading-relaxed text-slate-400">
              A GitHub Action runs on <code className="font-mono text-[0.78rem] text-slate-300">windows-latest</code>,
              installs <code className="font-mono text-[0.78rem] text-slate-300">requirements.txt</code> and invokes
              PyInstaller with <code className="font-mono text-[0.78rem] text-slate-300">--onefile --noconsole --uac-admin</code>,
              then commits the result back to <code className="font-mono text-[0.78rem] text-slate-300">main</code>.
            </p>
            <a
              href={`${LINKS.repo}/blob/main/.github/workflows/build.yml`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-[0.8rem] text-brand-300 hover:text-brand-200"
            >
              <GithubIcon className="size-3.5" />
              build.yml
              <ArrowRight className="size-3" />
            </a>
          </Card>

          <Card className="p-5">
            <p className="flex items-center gap-2 text-[0.9rem] font-semibold text-white">
              <ShieldCheck className="size-4 text-mint-400" />
              Keep detections up to date
            </p>
            <p className="mt-2 text-[0.83rem] leading-relaxed text-slate-400">
              The app pulls new hashes, patterns and YARA rules over HTTPS. Point{" "}
              <code className="font-mono text-[0.78rem] text-slate-300">UPDATE_URL</code> (or the{" "}
              <code className="font-mono text-[0.78rem] text-slate-300">GEMBYAV_UPDATE_URL</code>{" "}
              environment variable) at this feed:
            </p>
            <div className="mt-3 space-y-1.5">
              <Link
                href={UPDATE_ENDPOINTS.site}
                className="block truncate rounded-lg border border-white/[0.07] bg-void/60 px-3 py-2 font-mono text-[0.72rem] text-brand-300 hover:border-brand-400/35"
              >
                {UPDATE_ENDPOINTS.site}
              </Link>
              <a
                href={UPDATE_ENDPOINTS.github}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate rounded-lg border border-white/[0.07] bg-void/60 px-3 py-2 font-mono text-[0.72rem] text-slate-500 hover:border-brand-400/35 hover:text-brand-300"
              >
                {UPDATE_ENDPOINTS.github}
              </a>
            </div>
          </Card>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/dashboard" variant="secondary">
            Back to dashboard
          </ButtonLink>
          <ButtonLink href="/chat">
            Ask the assistant a question
            <ArrowRight className="size-4" />
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
