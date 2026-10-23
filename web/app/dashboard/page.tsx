import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Download,
  FileWarning,
  KeyRound,
  MessageSquare,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";
import { readSession } from "@/lib/auth/session";
import { DownloadPanel } from "@/components/download-panel";
import { Badge, Card, GithubIcon } from "@/components/ui";
import { StorageBadge } from "@/components/storage-badge";
import { LINKS, PRODUCT, UPDATE_ENDPOINTS } from "@/lib/config";
import { getManifest } from "@/lib/manifest";
import { formatDate } from "@/lib/site";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your GembyAV download, checksum and support assistant.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const CHECKLIST = [
  {
    title: "Download the installer",
    body: "Grab GembyAV.exe from the card on the left.",
    href: "/download",
    icon: Download,
  },
  {
    title: "Verify the SHA-256",
    body: "Run Get-FileHash and compare with the published digest.",
    href: "/download#checksum",
    icon: KeyRound,
  },
  {
    title: "Run a Quick Scan",
    body: "Covers Downloads, Desktop, Documents, Temp and Startup.",
    href: "/chat?q=how%20do%20i%20run%20a%20quick%20scan",
    icon: ScanSearch,
  },
  {
    title: "Test it with EICAR",
    body: "Confirm the engine actually fires before you trust it.",
    href: "/chat?q=eicar",
    icon: FileWarning,
  },
  {
    title: "Turn on real-time protection",
    body: "Optional watchdog layer over the folders that matter.",
    href: "/chat?q=real-time%20protection",
    icon: ShieldCheck,
  },
];

const SHORTCUTS = [
  {
    title: "Support assistant",
    body: "Answers grounded in the engine source and the docs.",
    href: "/chat",
    icon: MessageSquare,
    tone: "brand",
  },
  {
    title: "Signature feed",
    body: "Point UPDATE_URL here to keep detections fresh.",
    href: UPDATE_ENDPOINTS.site,
    icon: RefreshCw,
    tone: "mint",
  },
  {
    title: "Read the source",
    body: "One Python file. Every rule is plain data.",
    href: LINKS.source,
    icon: BookOpen,
    tone: "neutral",
  },
  {
    title: "Report a bug",
    body: "Include the log tail and the Reasons column.",
    href: LINKS.issues,
    icon: Bot,
    tone: "neutral",
  },
] as const;

const TONES = {
  brand: "border-brand-400/25 bg-brand-400/[0.09] text-brand-300",
  mint: "border-mint-400/25 bg-mint-400/[0.09] text-mint-300",
  neutral: "border-white/10 bg-white/[0.04] text-slate-300",
} as const;

export default async function DashboardPage() {
  const session = await readSession();
  if (!session) redirect("/signin?next=/dashboard&reason=auth");

  const manifest = getManifest();
  const firstName = session.name?.split(" ")[0] || "there";
  const memberSince = formatDate(new Date(session.iat * 1000).toISOString());
  const expires = formatDate(new Date(session.exp * 1000).toISOString());

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      {/* --------------------------------------------------------- greeting */}
      <header className="animate-rise">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="mint">
            <ShieldCheck className="size-3" />
            Signed in
          </Badge>
          <Badge tone="neutral">{PRODUCT.name} v{manifest.version}</Badge>
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance text-white sm:text-[2.5rem]">
          Welcome back, {firstName}.
        </h1>
        <p className="mt-2.5 max-w-2xl text-[0.95rem] leading-relaxed text-slate-400">
          Your download is unlocked. Verify the checksum before you run it, then ask the assistant
          anything about the engine — it has read the source so you do not have to.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.78rem] text-slate-500">
          <span className="font-mono">{session.email}</span>
          <span className="hidden h-3 w-px bg-white/10 sm:block" />
          <span>Session expires {expires}</span>
          <span className="hidden h-3 w-px bg-white/10 sm:block" />
          <StorageBadge />
        </div>
      </header>

      {/* ------------------------------------------------------- main grid */}
      <div className="mt-10 grid items-start gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="animate-rise" style={{ animationDelay: "80ms" }}>
          <DownloadPanel manifest={manifest} />

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {SHORTCUTS.map((s) => {
              const external = s.href.startsWith("http");
              const inner = (
                <>
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-xl border ${TONES[s.tone]}`}
                  >
                    <s.icon className="size-4" strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.88rem] font-medium text-white">{s.title}</span>
                    <span className="mt-0.5 block text-[0.78rem] leading-relaxed text-slate-500">
                      {s.body}
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-400" />
                </>
              );
              const cls =
                "group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-panel/40 p-3.5 transition-all hover:border-brand-400/30 hover:bg-panel/70";

              return external ? (
                <a
                  key={s.title}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cls}
                >
                  {inner}
                </a>
              ) : (
                <Link key={s.title} href={s.href} className={cls}>
                  {inner}
                </Link>
              );
            })}
          </div>
        </div>

        {/* ---------------------------------------------------- checklist */}
        <Card className="animate-rise p-5" style={{ animationDelay: "140ms" }}>
          <div>
            <h2 className="flex items-center gap-2 text-[0.95rem] font-semibold text-white">
              <ScanSearch className="size-4 text-brand-400" />
              First-run checklist
            </h2>
            <p className="mt-1.5 text-[0.82rem] leading-relaxed text-slate-500">
              Five steps from download to a verified, tested install.
            </p>

            <ol className="mt-5 space-y-1">
              {CHECKLIST.map((c, i) => (
                <li key={c.title}>
                  <Link
                    href={c.href}
                    className="group flex items-start gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-white/[0.04]"
                  >
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.03] font-mono text-[0.68rem] text-slate-400 transition-colors group-hover:border-brand-400/40 group-hover:text-brand-300">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.87rem] font-medium text-slate-200 group-hover:text-white">
                        {c.title}
                      </span>
                      <span className="mt-0.5 block text-[0.78rem] leading-relaxed text-slate-500">
                        {c.body}
                      </span>
                    </span>
                    <c.icon className="mt-0.5 size-4 shrink-0 text-slate-700 transition-colors group-hover:text-brand-400" />
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </Card>
      </div>

      {/* --------------------------------------------------- account panel */}
      <Card className="mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-[0.95rem] font-semibold text-white">Account & deployment</h2>
            <p className="mt-1.5 max-w-2xl text-[0.82rem] leading-relaxed text-slate-500">
              Signed in since {memberSince}. Your password is stored as a scrypt hash and your
              session is a signed httpOnly cookie — neither can be read back, including by whoever
              runs this site.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StorageBadge />
            <a
              href={LINKS.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[0.78rem] text-slate-400 transition-colors hover:border-brand-400/40 hover:text-brand-300"
            >
              <GithubIcon className="size-3.5" />
              {PRODUCT.repo}
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}
