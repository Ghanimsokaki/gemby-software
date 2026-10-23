"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Download, LayoutDashboard, LogOut, Menu, MessageSquare, X, type LucideIcon } from "lucide-react";
import { ButtonLink, GithubIcon, Logo } from "./ui";
import { useSession } from "./session-provider";
import { LINKS } from "@/lib/config";

interface NavItem {
  href: string;
  label: string;
  icon?: LucideIcon;
}

const PUBLIC_LINKS: NavItem[] = [
  { href: "/#features", label: "Features" },
  { href: "/#detection", label: "Detection" },
  { href: "/#download", label: "Download" },
  { href: "/#faq", label: "FAQ" },
];

const APP_LINKS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/download", label: "Download", icon: Download },
  { href: "/chat", label: "Assistant", icon: MessageSquare },
];

export function Nav() {
  const { user, loading, signOut } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const links = user ? APP_LINKS : PUBLIC_LINKS;
  const initials = user?.name
    ? user.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")
    : "?";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open ? "border-b border-white/[0.07] bg-void/85 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href={user ? "/dashboard" : "/"} className="group flex shrink-0 items-center gap-2.5">
          <Logo className="size-8 transition-transform duration-300 group-hover:scale-105" />
          <span className="text-[1.02rem] font-bold tracking-tight text-white">
            Gemby<span className="text-brand-400">AV</span>
          </span>
        </Link>

        <div className="ml-2 hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = pathname === l.href;
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[0.84rem] font-medium transition-colors ${
                  active ? "bg-white/[0.07] text-white" : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100"
                }`}
              >
                {Icon ? <Icon className="size-3.5" /> : null}
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <a
            href={LINKS.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white sm:block"
            aria-label="Source on GitHub"
            title="Source on GitHub"
          >
            <GithubIcon className="size-[18px]" />
          </a>

          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded-xl bg-white/[0.06]" />
          ) : user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <span
                className="grid size-9 place-items-center rounded-full border border-brand-400/30 bg-brand-400/10 text-[0.72rem] font-bold text-brand-300"
                title={user.email}
              >
                {initials}
              </span>
              <button
                onClick={() => void signOut()}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[0.82rem] text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-alert-300"
                title="Sign out"
              >
                <LogOut className="size-3.5" />
                <span className="hidden lg:inline">Sign out</span>
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <ButtonLink href="/signin" variant="ghost" size="sm">
                Sign in
              </ButtonLink>
              <ButtonLink href="/signup" size="sm">
                Get the download
              </ButtonLink>
            </div>
          )}

          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/[0.06] md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {open ? (
        <div className="border-t border-white/[0.07] bg-void/95 px-4 pt-2 pb-4 backdrop-blur-xl md:hidden">
          <div className="flex flex-col">
            {links.map((l) => {
              const Icon = l.icon;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    pathname === l.href ? "bg-white/[0.07] text-white" : "text-slate-300 hover:bg-white/[0.04]"
                  }`}
                >
                  {Icon ? <Icon className="size-4 text-brand-400" /> : null}
                  {l.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-white/[0.07] pt-3">
            {user ? (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{user.name}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
                <button
                  onClick={() => void signOut()}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition-colors hover:border-alert-500/40 hover:text-alert-300"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <ButtonLink href="/signin" variant="secondary" size="sm" className="flex-1">
                  Sign in
                </ButtonLink>
                <ButtonLink href="/signup" size="sm" className="flex-1">
                  Sign up
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
