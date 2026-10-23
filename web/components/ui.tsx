import Link from "next/link";
import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { Loader2 } from "lucide-react";

/* ------------------------------------------------------------------ button */

type Variant = "primary" | "secondary" | "ghost" | "danger" | "mint";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-brand-400 to-brand-600 text-void font-semibold " +
    "shadow-[0_8px_30px_-10px_rgba(34,211,238,.75)] hover:from-brand-300 hover:to-brand-500 " +
    "active:translate-y-px",
  secondary:
    "glass text-slate-100 hover:border-brand-400/40 hover:bg-brand-400/[0.07] active:translate-y-px",
  ghost: "text-slate-300 hover:text-white hover:bg-white/[0.06]",
  danger:
    "bg-alert-500/15 text-alert-300 border border-alert-500/35 hover:bg-alert-500/25 active:translate-y-px",
  mint: "bg-gradient-to-b from-mint-400 to-mint-600 text-void font-semibold " +
    "shadow-[0_8px_30px_-10px_rgba(52,211,153,.7)] hover:from-mint-300 hover:to-mint-500 active:translate-y-px",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[0.8rem] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-[0.95rem] gap-2.5 rounded-xl",
};

const BASE =
  "inline-flex items-center justify-center whitespace-nowrap transition-all duration-150 " +
  "disabled:opacity-45 disabled:pointer-events-none select-none";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  className?: string;
  children: ReactNode;
}

function classes(variant: Variant = "primary", size: Size = "md", className = "") {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`.trim();
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...rest
}: CommonProps & ComponentProps<"button">) {
  return (
    <button
      className={classes(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends CommonProps {
  href: string;
  onClick?: () => void;
  ariaLabel?: string;
}

/** Internal links use <Link>, absolute URLs open in a new tab. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  onClick,
  ariaLabel,
}: ButtonLinkProps) {
  const cls = classes(variant, size, className);
  if (href.startsWith("http")) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cls}
        onClick={onClick}
        aria-label={ariaLabel}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} onClick={onClick} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

/* -------------------------------------------------------------------- card */

export function Card({
  className = "",
  children,
  hover = false,
  style,
}: {
  className?: string;
  children: ReactNode;
  hover?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      style={style}
      className={`glass rounded-2xl ${hover ? "transition-all duration-300 hover:border-brand-400/35 hover:-translate-y-0.5" : ""} ${className}`.trim()}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------- badge */

type Tone = "brand" | "mint" | "alert" | "gold" | "neutral";

const TONES: Record<Tone, string> = {
  brand: "bg-brand-400/12 text-brand-300 border-brand-400/25",
  mint: "bg-mint-400/12 text-mint-300 border-mint-400/25",
  alert: "bg-alert-400/12 text-alert-300 border-alert-400/25",
  gold: "bg-gold-400/12 text-gold-300 border-gold-400/25",
  neutral: "bg-white/[0.05] text-slate-300 border-white/10",
};

export function Badge({
  tone = "neutral",
  className = "",
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.7rem] font-medium tracking-wide ${TONES[tone]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------- input */

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[0.8rem] font-medium text-slate-300">{label}</span>
        {hint ? <span className="text-[0.7rem] text-slate-500">{hint}</span> : null}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-[0.75rem] text-alert-300">{error}</span>
      ) : null}
    </label>
  );
}

export function Input({
  className = "",
  invalid = false,
  ...rest
}: ComponentProps<"input"> & { invalid?: boolean }) {
  return (
    <input
      className={`h-11 w-full rounded-xl border bg-abyss/70 px-3.5 text-sm text-slate-100
        placeholder:text-slate-600 transition-colors duration-150
        focus:border-brand-400/60 focus:bg-abyss focus:outline-none
        ${invalid ? "border-alert-500/50" : "border-white/10"} ${className}`.replace(/\s+/g, " ").trim()}
      {...rest}
    />
  );
}

/* ------------------------------------------------------------------- misc */

export function SectionHeading({
  eyebrow,
  title,
  sub,
  align = "center",
}: {
  eyebrow?: string;
  title: ReactNode;
  sub?: ReactNode;
  align?: "center" | "left";
}) {
  return (
    <div className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}>
      {eyebrow ? (
        <div
          className={`mb-3 flex items-center gap-2 text-[0.72rem] font-semibold tracking-[0.18em] text-brand-400 uppercase ${
            align === "center" ? "justify-center" : ""
          }`}
        >
          <span className="h-px w-6 bg-brand-400/50" />
          {eyebrow}
        </div>
      ) : null}
      <h2 className="text-3xl font-bold text-white sm:text-4xl">{title}</h2>
      {sub ? <p className="mt-3.5 text-[0.95rem] leading-relaxed text-slate-400">{sub}</p> : null}
    </div>
  );
}

export function GithubIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11.1 11.1 0 0 1 5.78 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.24 2.76.12 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.06.78 2.14 0 1.54-.01 2.79-.01 3.17 0 .31.2.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}

export function Logo({ className = "size-8" }: { className?: string }) {
  return (
    <span
      className={`relative grid place-items-center rounded-[10px] bg-gradient-to-br from-brand-400 to-brand-700 shadow-[0_0_22px_-4px_rgba(34,211,238,.7)] ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-[62%]" aria-hidden>
        <path
          d="M12 2.6 4.6 5.5v6.1c0 4.5 3.1 8.4 7.4 9.8 4.3-1.4 7.4-5.3 7.4-9.8V5.5L12 2.6Z"
          fill="rgba(4,6,13,.9)"
          stroke="rgba(236,254,255,.92)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="m8.7 12.1 2.3 2.3 4.4-4.6"
          stroke="#6ee7b7"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
