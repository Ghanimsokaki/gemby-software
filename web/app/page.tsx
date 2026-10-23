import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  Fingerprint,
  Layers,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { HeroScan } from "@/components/hero-scan";
import { DownloadPanel } from "@/components/download-panel";
import { Faq } from "@/components/faq";
import { Badge, ButtonLink, Card, GithubIcon, SectionHeading } from "@/components/ui";
import { FEATURES, LINKS, PIPELINE, PRODUCT, STATS, THRESHOLDS } from "@/lib/config";
import { getManifest } from "@/lib/manifest";

export const dynamic = "force-dynamic";

const ICONS = {
  layers: Layers,
  fingerprint: Fingerprint,
  activity: Activity,
  zap: Zap,
  lock: Lock,
  refresh: RefreshCw,
} as const;

const ACCENTS = {
  brand: "border-brand-400/25 bg-brand-400/[0.09] text-brand-300",
  mint: "border-mint-400/25 bg-mint-400/[0.09] text-mint-300",
  amber: "border-gold-400/25 bg-gold-400/[0.09] text-gold-300",
} as const;

export default function LandingPage() {
  const manifest = getManifest();

  return (
    <>
      {/* ============================================================== HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pt-20 lg:pb-28">
          <div className="animate-rise">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="mint">
                <ShieldCheck className="size-3" />
                v{PRODUCT.version} released
              </Badge>
              <Badge tone="neutral">Apache-2.0</Badge>
              <Badge tone="neutral">Windows 10 / 11</Badge>
            </div>

            <h1 className="mt-6 text-[2.6rem] leading-[1.05] font-extrabold tracking-tight text-balance text-white sm:text-6xl">
              Antivirus that{" "}
              <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-mint-400 bg-clip-text text-transparent text-glow">
                shows its working
              </span>
              .
            </h1>

            <p className="mt-5 max-w-xl text-[1.02rem] leading-relaxed text-slate-400">
              {PRODUCT.fullName} runs six independent detection layers over every file and adds
              their scores together. You get a number from 0 to 100, a plain-English list of{" "}
              <em className="text-slate-300 not-italic">exactly</em> which rules fired — and one
              readable Python file you can audit yourself.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink href="/signup" size="lg">
                <Lock className="size-4" />
                Sign in to download
              </ButtonLink>
              <ButtonLink href="#detection" variant="secondary" size="lg">
                See how detection works
                <ArrowRight className="size-4" />
              </ButtonLink>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.78rem] text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-mint-400" />
                No telemetry, ever
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-brand-400" />
                YARA + PE + entropy analysis
              </span>
              <a
                href={LINKS.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 transition-colors hover:text-brand-300"
              >
                <GithubIcon className="size-3.5" />
                {PRODUCT.repo}
              </a>
            </div>
          </div>

          <div className="animate-rise lg:pl-4" style={{ animationDelay: "120ms" }}>
            <HeroScan />
          </div>
        </div>

        {/* ------------------------------------------------------- stats bar */}
        <div className="border-y border-white/[0.06] bg-abyss/50">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 sm:px-6 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="px-2 py-6 text-center lg:py-7">
                <dt className="order-2 mt-1 block text-[0.74rem] tracking-wide text-slate-500">
                  {s.label}
                </dt>
                <dd className="order-1 block bg-gradient-to-b from-white to-slate-400 bg-clip-text font-mono text-2xl font-bold text-transparent lg:text-3xl">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* =========================================================== FEATURES */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6 lg:py-28">
        <SectionHeading
          eyebrow="What is inside"
          title="Six engines, one verdict"
          sub="No black box. Every layer is a small, readable piece of Python that contributes points to a single risk score you can inspect in the Threats table."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = ICONS[f.icon];
            return (
              <Card
                key={f.title}
                hover
                className="group animate-rise p-5"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div>
                  <span
                    className={`grid size-11 place-items-center rounded-xl border transition-transform duration-300 group-hover:scale-110 ${ACCENTS[f.accent]}`}
                  >
                    <Icon className="size-5" strokeWidth={1.9} />
                  </span>
                  <h3 className="mt-4 text-[1.02rem] font-semibold text-white">{f.title}</h3>
                  <p className="mt-2 text-[0.86rem] leading-relaxed text-slate-400">{f.body}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ========================================================== DETECTION */}
      <section id="detection" className="scroll-mt-24 border-y border-white/[0.06] bg-abyss/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <SectionHeading
            eyebrow="The pipeline"
            title="How a file becomes a verdict"
            sub={`Points accumulate from every layer. ${THRESHOLDS.malicious}+ is MALICIOUS, ${THRESHOLDS.suspicious}–${THRESHOLDS.malicious - 1} is SUSPICIOUS, and anything quieter is dropped so the results stay readable.`}
          />

          <div className="mt-14 grid gap-3 lg:grid-cols-3">
            {PIPELINE.map((p, i) => (
              <div
                key={p.step}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-panel/40 p-5 transition-all duration-300 hover:border-brand-400/30 hover:bg-panel/70"
              >
                <div
                  aria-hidden
                  className="absolute -top-16 -right-16 size-32 rounded-full bg-brand-500/[0.09] blur-2xl transition-opacity duration-300 group-hover:opacity-100 sm:opacity-0"
                />
                <div className="relative flex items-start justify-between gap-3">
                  <span className="font-mono text-[0.72rem] font-semibold text-brand-500">
                    {p.step}
                  </span>
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 font-mono text-[0.64rem] text-slate-400">
                    {p.weight}
                  </span>
                </div>
                <h3 className="relative mt-3 text-[1rem] font-semibold text-white">{p.title}</h3>
                <p className="relative mt-1.5 text-[0.85rem] leading-relaxed text-slate-400">
                  {p.detail}
                </p>
                {i < PIPELINE.length - 1 ? (
                  <span
                    aria-hidden
                    className="absolute right-0 bottom-0 hidden h-px w-8 bg-gradient-to-r from-brand-400/40 to-transparent lg:block"
                  />
                ) : null}
              </div>
            ))}
          </div>

          {/* verdict scale */}
          <div className="mt-10 overflow-hidden rounded-2xl border border-white/[0.07] bg-panel/40">
            <div className="flex h-2.5">
              <div className="bg-mint-500/60" style={{ width: `${THRESHOLDS.suspicious}%` }} />
              <div
                className="bg-gold-400/70"
                style={{ width: `${THRESHOLDS.malicious - THRESHOLDS.suspicious}%` }}
              />
              <div className="bg-alert-500/80" style={{ width: `${100 - THRESHOLDS.malicious}%` }} />
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <div>
                <p className="font-mono text-[0.72rem] text-mint-400">0 – {THRESHOLDS.suspicious - 1}</p>
                <p className="mt-1 text-[0.86rem] font-medium text-white">Not reported</p>
                <p className="mt-0.5 text-[0.8rem] text-slate-500">
                  Quiet heuristics are dropped so the Threats table stays readable.
                </p>
              </div>
              <div>
                <p className="font-mono text-[0.72rem] text-gold-300">
                  {THRESHOLDS.suspicious} – {THRESHOLDS.malicious - 1}
                </p>
                <p className="mt-1 text-[0.86rem] font-medium text-white">SUSPICIOUS</p>
                <p className="mt-0.5 text-[0.8rem] text-slate-500">
                  Heuristic-only. Read the Reasons column before you quarantine.
                </p>
              </div>
              <div>
                <p className="font-mono text-[0.72rem] text-alert-300">
                  {THRESHOLDS.malicious} – 100
                </p>
                <p className="mt-1 text-[0.86rem] font-medium text-white">MALICIOUS</p>
                <p className="mt-0.5 text-[0.8rem] text-slate-500">
                  Several layers agreed. Quarantine is one click away.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================== DOWNLOAD */}
      <section id="download" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6 lg:py-28">
        <div className="grid items-start gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Get the binary"
              title="Download GembyAV"
              sub="One self-contained executable. Python, pefile, yara-python and watchdog are all bundled in — there is nothing else to install."
            />

            <ul className="mt-8 space-y-3">
              {[
                "Built by GitHub Actions on windows-latest, committed straight back to the repo",
                "SHA-256 published here so you can verify what you downloaded",
                "Requests administrator rights at launch — that is the UAC prompt, not a warning",
                "Signature updates pull from this site, so detections improve without a reinstall",
              ].map((t) => (
                <li key={t} className="flex gap-3 text-[0.88rem] leading-relaxed text-slate-400">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-mint-400" />
                  {t}
                </li>
              ))}
            </ul>

            <Card className="mt-8 p-4">
              <p className="flex items-start gap-2.5 text-[0.8rem] leading-relaxed text-slate-400">
                <Bot className="mt-0.5 size-4 shrink-0 text-brand-400" />
                <span>
                  Stuck on something? The support assistant is available on every page — ask it
                  about SmartScreen, false positives, YARA rules or quarantine.{" "}
                  <Link href="/chat" className="text-brand-300 underline decoration-brand-400/40 underline-offset-2 hover:text-brand-200">
                    Open the assistant
                  </Link>
                </span>
              </p>
            </Card>
          </div>

          <DownloadPanel manifest={manifest} />
        </div>
      </section>

      {/* ============================================================== FAQ */}
      <section id="faq" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6 lg:py-24">
        <SectionHeading
          eyebrow="Questions"
          title="Before you download"
          sub="The things people actually ask — SmartScreen, Defender, false positives and where the files live."
        />
        <div className="mt-12">
          <Faq />
        </div>
      </section>

      {/* ========================================================= FINAL CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-brand-700/25 via-panel/60 to-abyss p-8 text-center sm:p-14">
          <div aria-hidden className="absolute inset-0 grid-bg opacity-40" />
          <div
            aria-hidden
            className="absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-brand-500/20 blur-[100px]"
          />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-balance text-white sm:text-4xl">
              Scan something suspicious today
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[0.95rem] leading-relaxed text-slate-400">
              Free, open source, {manifest.sizeLabel ?? "13 MB"}, and it takes about as long as
              reading this sentence to get started.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/signup" size="lg">
                Create free account
                <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink href={LINKS.source} variant="secondary" size="lg">
                <GithubIcon className="size-4" />
                Read the source
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-center py-6">
        <span className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-panel/50 px-4 py-2 text-[0.75rem] text-slate-500">
          <Zap className="size-3.5 text-brand-500" />
          {PRODUCT.name} {PRODUCT.version} · {manifest.sizeLabel} · built{" "}
          <span className="font-mono">
            {new Date(manifest.preparedAt).toISOString().slice(0, 10)}
          </span>
        </span>
      </div>
    </>
  );
}
