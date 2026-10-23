import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { ChatWidget } from "@/components/chat-widget";
import { SessionProvider } from "@/components/session-provider";
import { SITE } from "@/lib/site";
import { CHAT_MODEL, PRODUCT } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: `%s · ${PRODUCT.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "GembyAV",
    "antivirus",
    "windows antivirus",
    "open source antivirus",
    "YARA",
    "malware scanner",
    "EICAR",
    "quarantine",
  ],
  authors: [{ name: PRODUCT.repo, url: SITE.url }],
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    url: SITE.url,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#04060d",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh bg-void antialiased">
        {/* Ambient background — fixed so it does not repaint on scroll. */}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 grid-bg noise-mask opacity-[0.55]" />
          <div className="absolute -top-40 left-1/2 size-[42rem] -translate-x-1/2 rounded-full bg-brand-600/[0.13] blur-[130px]" />
          <div className="absolute top-[38%] -left-40 size-[30rem] rounded-full bg-mint-600/[0.07] blur-[120px]" />
          <div className="absolute -right-40 bottom-0 size-[34rem] rounded-full bg-brand-700/[0.09] blur-[130px]" />
        </div>

        <SessionProvider>
          <div className="relative z-10 flex min-h-dvh flex-col">
            <Nav />
            <main className="flex-1 pt-16">{children}</main>
            <Footer />
            <ChatWidget />
          </div>
        </SessionProvider>

        {/* Lets the widget tell the user which model is answering. */}
        <script
          id="gemby-runtime-config"
          type="application/json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({ model: CHAT_MODEL, version: PRODUCT.version }),
          }}
        />
      </body>
    </html>
  );
}
