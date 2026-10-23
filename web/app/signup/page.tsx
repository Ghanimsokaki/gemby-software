import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Create account",
  description:
    "Create a free account to download GembyAV.exe, verify its SHA-256 checksum and use the support assistant.",
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

export default function SignUpPage() {
  return (
    <AuthShell mode="signup">
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
