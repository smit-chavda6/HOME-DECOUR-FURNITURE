import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false },
};

export default function RegisterPage() {
  return (
    <AuthShell
      mode="register"
      title={<>Create your <em className="text-gradient">account</em></>}
      description="It takes a minute. You can add your delivery address at checkout."
    >
      <RegisterForm />
    </AuthShell>
  );
}
