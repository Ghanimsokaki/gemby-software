"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";

/**
 * A scripted replay of a real GembyAV Quick Scan. The paths, verdicts and
 * reason strings are taken from the actual engine rules so the demo cannot
 * overstate what the product does.
 */

type Verdict = "CLEAN" | "SUSPICIOUS" | "MALICIOUS";

interface Row {
  path: string;
  verdict: Verdict;
  score?: number;
  reason?: string;
}

const SCRIPT: Row[] = [
  { path: "C:\\Users\\you\\Desktop\\budget-q3.xlsx", verdict: "CLEAN" },
  { path: "C:\\Users\\you\\Downloads\\node-v22-x64.msi", verdict: "CLEAN" },
  { path: "C:\\Users\\you\\Downloads\\invoice_final.pdf.exe", verdict: "MALICIOUS", score: 100, reason: "Double extension disguise; Suspicious APIs: URLDownloadToFileW" },
  { path: "C:\\Users\\you\\Documents\\resume.docx", verdict: "CLEAN" },
  { path: "C:\\Users\\you\\AppData\\Local\\Temp\\svchost.bat", verdict: "SUSPICIOUS", score: 55, reason: "Pattern: PS.DownloadCradle; Executable in temp folder" },
  { path: "C:\\Users\\you\\Downloads\\photo_2041.jpg", verdict: "CLEAN" },
  { path: "C:\\Users\\you\\Downloads\\crack-loader.exe", verdict: "MALICIOUS", score: 85, reason: "High entropy (7.81); Packer section: .upx0; YARA: Suspicious_PowerShell_Download" },
  { path: "C:\\Users\\you\\Desktop\\notes.txt", verdict: "CLEAN" },
  { path: "…\\Start Menu\\Programs\\Startup\\update.vbs", verdict: "SUSPICIOUS", score: 45, reason: "Pattern: VBS.ShellExec" },
  { path: "C:\\Users\\you\\Documents\\contract-signed.pdf", verdict: "CLEAN" },
  { path: "C:\\Users\\you\\Downloads\\eicar.com", verdict: "MALICIOUS", score: 100, reason: "Pattern: EICAR-Test-File; YARA: EICAR_Test_File" },
  { path: "C:\\Users\\you\\Downloads\\ffmpeg-7.1.exe", verdict: "CLEAN" },
];

const TICK_MS = 780;

const STYLES: Record<Verdict, string> = {
  CLEAN: "text-slate-500",
  SUSPICIOUS: "text-gold-300",
  MALICIOUS: "text-alert-400",
};

const PILLS: Record<Verdict, string> = {
  CLEAN: "border-white/[0.07] bg-white/[0.03] text-slate-500",
  SUSPICIOUS: "border-gold-400/30 bg-gold-400/10 text-gold-300",
  MALICIOUS: "border-alert-500/35 bg-alert-500/12 text-alert-300",
};

/** Ticks the summary is held on screen before the demo loops. */
const HOLD_TICKS = 4;

interface ScanState {
  rows: Row[];
  index: number;
  quarantined: number;
  hold: number;
}

const INITIAL: ScanState = { rows: [], index: 0, quarantined: 0, hold: 0 };

/** Pure reducer — safe under StrictMode's double-invoked updaters. */
function advance(prev: ScanState): ScanState {
  if (prev.index >= SCRIPT.length) {
    if (prev.hold + 1 >= HOLD_TICKS) return INITIAL;
    return { ...prev, hold: prev.hold + 1 };
  }
  const row = SCRIPT[prev.index];
  return {
    rows: [...prev.rows.slice(-7), row],
    index: prev.index + 1,
    quarantined: prev.quarantined + (row.verdict === "MALICIOUS" ? 1 : 0),
    hold: 0,
  };
}

export function HeroScan() {
  const [state, setState] = useState<ScanState>(INITIAL);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setState(advance), TICK_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.rows]);

  const { rows, index, quarantined } = state;
  const done = index >= SCRIPT.length;
  const progress = Math.min(100, Math.round((index / SCRIPT.length) * 100));
  const scanned = 1240 + index * 137;

  return (
    <div className="relative">
      {/* ambient glow behind the window */}
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-brand-600/25 via-transparent to-mint-500/15 blur-2xl"
      />

      <div className="glass relative overflow-hidden rounded-2xl shadow-[0_30px_90px_-25px_rgba(0,0,0,.95)]">
        {/* --------------------------------------------------- title bar */}
        <div className="flex items-center gap-2 border-b border-white/[0.07] bg-panel/70 px-3.5 py-2.5">
          <span className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-alert-500/70" />
            <span className="size-2.5 rounded-full bg-gold-400/70" />
            <span className="size-2.5 rounded-full bg-mint-500/70" />
          </span>
          <p className="ml-1.5 font-mono text-[0.7rem] text-slate-500">Gemby AV 1.0.0 — Quick Scan</p>
          <span className="ml-auto flex items-center gap-1.5 rounded-full border border-mint-400/25 bg-mint-400/10 px-2 py-0.5 text-[0.62rem] font-medium text-mint-300">
            <ShieldCheck className="size-3" />
            Protected
          </span>
        </div>

        {/* ----------------------------------------------------- toolbar */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-white/[0.06] bg-abyss/50 px-3 py-2.5">
          {["Quick Scan", "Full Scan", "Scan Folder…", "Update Signatures"].map((b, i) => (
            <span
              key={b}
              className={`rounded-md border px-2 py-1 font-mono text-[0.64rem] ${
                i === 0
                  ? "border-brand-400/40 bg-brand-400/12 text-brand-200"
                  : "border-white/[0.08] bg-white/[0.02] text-slate-500"
              }`}
            >
              {b}
            </span>
          ))}
          <span className="ml-auto flex items-center gap-1.5 font-mono text-[0.62rem] text-mint-400">
            <span className="size-1.5 animate-pulse rounded-full bg-mint-400" />
            real-time ON
          </span>
        </div>

        {/* ------------------------------------------------------- status */}
        <div className="px-3.5 pt-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate font-mono text-[0.7rem] text-slate-400">
              {done ? (
                <span className="text-mint-300">
                  Scan complete — {scanned.toLocaleString()} files, {quarantined} threats
                </span>
              ) : (
                <>Scanned {scanned.toLocaleString()} files…</>
              )}
            </p>
            <p className="shrink-0 font-mono text-[0.7rem] text-brand-400">{progress}%</p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                done
                  ? "bg-gradient-to-r from-mint-500 to-mint-300"
                  : "bg-gradient-to-r from-brand-600 via-brand-400 to-brand-300"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* --------------------------------------------------- scan lines */}
        <div className="relative mt-3 px-3.5 pb-3.5">
          <div
            ref={listRef}
            className="scrollbar-slim h-[13.5rem] overflow-hidden font-mono text-[0.7rem] leading-relaxed"
          >
            {rows.length === 0 ? (
              <p className="pt-6 text-center text-slate-600">Initialising engine…</p>
            ) : (
              rows.map((r, i) => (
                <div
                  key={`${r.path}-${i}`}
                  className="flex animate-rise items-center gap-2 border-b border-white/[0.04] py-[0.42rem] last:border-0"
                  style={{ animationDuration: "0.4s" }}
                >
                  <span className={`truncate ${STYLES[r.verdict]} ${i === rows.length - 1 ? "" : "opacity-45"}`}>
                    {r.path}
                  </span>
                  <span
                    className={`ml-auto shrink-0 rounded border px-1.5 py-px text-[0.58rem] tracking-wide ${PILLS[r.verdict]}`}
                  >
                    {r.verdict === "CLEAN" ? "OK" : `${r.verdict} ${r.score}`}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* sweeping scanline */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden">
            <div className="h-8 w-full animate-scanline bg-gradient-to-b from-transparent via-brand-400/[0.14] to-transparent" />
          </div>

          {/* last detection detail */}
          <div className="mt-1 min-h-[2.1rem] rounded-lg border border-white/[0.06] bg-void/60 px-2.5 py-1.5">
            {(() => {
              const flagged = [...rows].reverse().find((r) => r.verdict !== "CLEAN");
              if (!flagged?.reason) {
                return (
                  <p className="font-mono text-[0.63rem] text-slate-600">
                    6 layers · hashes · regex · YARA · PE imports · entropy · context
                  </p>
                );
              }
              return (
                <p className="font-mono text-[0.63rem] leading-relaxed">
                  <span className={STYLES[flagged.verdict]}>{flagged.verdict}</span>
                  <span className="text-slate-600"> reasons: </span>
                  <span className="text-slate-400">{flagged.reason}</span>
                </p>
              );
            })()}
          </div>
        </div>
      </div>

      {/* floating quarantine counter */}
      <div className="absolute -bottom-5 -left-4 hidden animate-float items-center gap-2.5 rounded-xl border border-alert-500/25 bg-panel/95 px-3.5 py-2.5 shadow-[0_16px_44px_-14px_rgba(0,0,0,.9)] backdrop-blur-xl sm:flex">
        <span className="grid size-8 place-items-center rounded-lg bg-alert-500/12 text-alert-300">
          <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden>
            <rect x="4" y="10.5" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.7" />
            <path d="M8 10.5V7.6a4 4 0 0 1 8 0v2.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </span>
        <div>
          <p className="text-[0.7rem] text-slate-500">Quarantined</p>
          <p className="font-mono text-sm font-semibold text-white">
            {quarantined} <span className="text-[0.65rem] font-normal text-slate-500">XOR 0x5A</span>
          </p>
        </div>
      </div>
    </div>
  );
}
