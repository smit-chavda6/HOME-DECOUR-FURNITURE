import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Log in",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <AuthShell
      mode="login"
      title={<>Welcome <em className="text-gradient">back</em></>}
      description="Log in to check out, track orders and review your furniture."
    >
      <LoginForm />
    </AuthShell>
  );
}
