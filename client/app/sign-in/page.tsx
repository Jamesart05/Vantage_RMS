"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { AuthLayout, FormField, authInputClass } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await authClient.signIn.email({ email, password });

    setLoading(false);
    if (signInError) {
      setError(signInError.message ?? "Couldn't sign you in. Check your email and password.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your BusinessOS workspace">
      <form onSubmit={handleSubmit}>
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </FormField>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[12.5px] font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" disabled={loading} className="mt-5 w-full justify-center">
          <LogIn className="h-4 w-4" /> {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-5 text-center text-[12.5px] text-ink-muted">
        Don&rsquo;t have an account?{" "}
        <Link href="/sign-up" className="font-semibold text-brand-700 dark:text-brand-400">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
