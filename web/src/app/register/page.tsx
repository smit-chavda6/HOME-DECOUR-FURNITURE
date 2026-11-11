import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false },
};

export default function RegisterPage() {
  return (
    <AuthShell title="Create your account" description="It takes a minute. You can add your delivery address at checkout.">
      <RegisterForm />
    </AuthShell>
  );
}
