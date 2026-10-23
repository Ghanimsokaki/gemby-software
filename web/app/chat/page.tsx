import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { ChatPageShell, type TopicGroup } from "@/components/chat-page-shell";
import { ARTICLES, GROUPS } from "@/lib/bot/knowledge";

export const metadata: Metadata = {
  title: "Support assistant",
  description:
    "Chat with the GembyAV support assistant — installing, scanning, quarantine, YARA rules and troubleshooting.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function ChatPage({ searchParams }: Props) {
  const session = await readSession();
  if (!session) redirect("/signin?next=/chat&reason=auth");

  const { q } = await searchParams;

  const topics: TopicGroup[] = GROUPS.map((group) => ({
    group,
    items: ARTICLES.filter((a) => a.group === group).map((a) => a.title),
  })).filter((g) => g.items.length > 0);

  return (
    <ChatPageShell
      name={session.name}
      initialQuery={q ? decodeURIComponent(q).slice(0, 200) : undefined}
      topics={topics}
    />
  );
}
