"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { AuthLayout, FormField, authInputClass } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const { error: signUpError } = await authClient.signUp.email({ name, email, password });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message ?? "Couldn't create your account. Try a different email.");
      return;
    }

    // Fresh accounts have no organization yet — send them to create their company.
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <AuthLayout title="Create your account" subtitle="Set up BusinessOS for your business">
      <form onSubmit={handleSubmit}>
        <FormField label="Full name">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={authInputClass}
            placeholder="Adaeze Okafor"
            autoComplete="name"
          />
        </FormField>
        <FormField label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClass}
            placeholder="you@company.com"
            autoComplete="email"
          />
        </FormField>
        <FormField label="Password">
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
        </FormField>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[12.5px] font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" disabled={loading} className="mt-5 w-full justify-center">
          <UserPlus className="h-4 w-4" /> {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-5 text-center text-[12.5px] text-ink-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-brand-700 dark:text-brand-400">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
