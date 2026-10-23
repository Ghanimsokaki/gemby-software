import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to download GembyAV.exe, verify its checksum and talk to the support assistant.",
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <AuthShell mode="signin">
      <AuthForm mode="signin" />
    </AuthShell>
  );
}
