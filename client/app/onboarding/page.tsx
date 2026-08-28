"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { authClient, useSession, useActiveOrganization } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { AuthLayout, FormField, authInputClass } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";

const BUSINESS_TYPES = [
  { value: "SUPERMARKET", label: "Supermarket" },
  { value: "DISTRIBUTOR", label: "Distributor" },
  { value: "WHOLESALER", label: "Wholesaler" },
  { value: "MANUFACTURING", label: "Manufacturing" },
  { value: "PHARMACY", label: "Pharmacy" },
  { value: "LOGISTICS", label: "Logistics" },
  { value: "SCHOOL", label: "School" },
  { value: "HOSPITAL", label: "Hospital" },
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "OTHER", label: "Other" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const { data: activeOrg, isPending: orgPending } = useActiveOrganization();

  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("SUPERMARKET");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionPending) return;
    if (!session?.user) {
      router.replace("/sign-in");
      return;
    }
    if (!orgPending && activeOrg) {
      router.replace("/dashboard");
    }
  }, [session, sessionPending, activeOrg, orgPending, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const org = await api.post<{ organizationId: string }>("/onboarding/company", { name, businessType });
      // Keep better-auth's own client cache/session in sync with the org we just created.
      await authClient.organization.setActive({ organizationId: org.data.organizationId });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create your company. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sessionPending || !session?.user || orgPending) {
    return null;
  }

  return (
    <AuthLayout title="Create your company" subtitle="A couple of details and you're in">
      <form onSubmit={handleSubmit}>
        <FormField label="Company name">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={authInputClass}
            placeholder="Sunrise Trading Co."
            autoComplete="organization"
          />
        </FormField>
        <FormField label="Business type">
          <select
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className={authInputClass}
          >
            {BUSINESS_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </FormField>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[12.5px] font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" disabled={loading} className="mt-5 w-full justify-center">
          <Building2 className="h-4 w-4" /> {loading ? "Creating company…" : "Create company"}
        </Button>
      </form>
    </AuthLayout>
  );
}
