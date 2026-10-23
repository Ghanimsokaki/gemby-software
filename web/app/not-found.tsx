import Link from "next/link";
import { ArrowRight, Compass, Home, MessageSquare } from "lucide-react";
import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <span className="grid size-16 place-items-center rounded-2xl border border-brand-400/25 bg-brand-400/[0.07] text-brand-300">
        <Compass className="size-8" />
      </span>

      <p className="mt-7 font-mono text-[0.78rem] tracking-[0.2em] text-brand-500 uppercase">
        Error 404
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Nothing scanned at this path
      </h1>
      <p className="mt-3.5 text-[0.95rem] leading-relaxed text-slate-400">
        The page you were after does not exist. It may have been moved, or the link may be
        mistyped — the rest of the portal is exactly where you left it.
      </p>

      <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
        <ButtonLink href="/">
          <Home className="size-4" />
          Back to the landing page
        </ButtonLink>
        <ButtonLink href="/chat" variant="secondary">
          <MessageSquare className="size-4" />
          Ask the assistant
        </ButtonLink>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-2">
        {["/", "/dashboard", "/download", "/chat", "/signin", "/signup"].map((p) => (
          <Link
            key={p}
            href={p}
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 font-mono text-[0.72rem] text-slate-500 transition-colors hover:border-brand-400/35 hover:text-brand-300"
          >
            {p}
          </Link>
        ))}
      </div>

      <p className="mt-10 text-[0.78rem] text-slate-600">
        Looking for something the engine does?{" "}
        <Link
          href="/chat?q=what%20can%20you%20do"
          className="text-brand-400 underline decoration-brand-400/40 underline-offset-2 hover:text-brand-300"
        >
          Ask Gemby <ArrowRight className="inline size-3" />
        </Link>
      </p>
    </div>
  );
}
