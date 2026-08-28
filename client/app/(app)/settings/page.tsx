"use client";

import { useState } from "react";
import { Edit2, Shield, UserPlus, Loader2, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CreateModal, type CreateField } from "@/components/ui/CreateModal";
import { useToast } from "@/components/ui/Toast";
import {
  getCurrentOrganization,
  getOrganizationSettings,
  updateOrganizationSettings,
  updateCurrentOrganization,
  listMembers,
  updateMemberRole,
  removeMember,
} from "@/lib/queries";
import { authClient } from "@/lib/auth-client";
import { useApi } from "@/lib/useApi";
import { humanize, initials } from "@/lib/format";
import { PAGE_META } from "@/lib/nav";

const ROLES = ["owner", "admin", "manager", "hr", "accountant", "storekeeper", "salesManager"];

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 py-2.5 text-[13px] last:border-0 dark:border-white/10">
      <span className="text-ink-muted">{k}</span>
      <span className="font-semibold">{v}</span>
    </div>
  );
}

export default function SettingsPage() {
  const showToast = useToast();
  const org = useApi(() => getCurrentOrganization(), []);
  const settings = useApi(() => getOrganizationSettings(), []);
  const members = useApi(() => listMembers(), []);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const inviteFields: CreateField[] = [
    { name: "email", label: "Email address", type: "email", required: true },
    { name: "role", label: "Role", type: "select", options: ROLES.map((r) => ({ value: r, label: humanize(r) })), defaultValue: "manager" },
  ];

  return (
    <>
      <PageHeader title={PAGE_META.settings.title} desc={PAGE_META.settings.desc} />

      <div className="mb-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <Card padded>
          <p className="mb-1 text-[14.5px] font-bold">Company Information</p>
          <div className="flex items-center justify-between border-b border-slate-200 py-2.5 text-[13px] dark:border-white/10">
            <span className="text-ink-muted">Company name</span>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[13px] outline-none focus:border-brand-500 dark:border-white/10 dark:bg-[#0F1B16]"
                />
                <button
                  onClick={async () => {
                    await updateCurrentOrganization({ name: nameDraft });
                    setEditingName(false);
                    org.refetch();
                    showToast("Company name updated");
                  }}
                  className="text-[12px] font-semibold text-brand-700 dark:text-brand-400"
                >
                  Save
                </button>
              </div>
            ) : (
              <span className="font-semibold">{org.data?.name ?? "—"}</span>
            )}
          </div>
          <KV k="Slug" v={org.data?.slug ?? "—"} />
          <KV
            k="Currency"
            v={
              <select
                defaultValue={settings.data?.currency ?? "NGN"}
                onChange={async (e) => {
                  setSavingSettings(true);
                  await updateOrganizationSettings({ currency: e.target.value });
                  setSavingSettings(false);
                  showToast("Currency updated");
                }}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[13px] outline-none dark:border-white/10 dark:bg-[#0F1B16]"
              >
                {["NGN", "GHS", "KES", "ZAR", "USD"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            }
          />
          <KV
            k="Date format"
            v={
              <select
                defaultValue={settings.data?.dateFormat ?? "DD/MM/YYYY"}
                onChange={async (e) => {
                  setSavingSettings(true);
                  await updateOrganizationSettings({ dateFormat: e.target.value });
                  setSavingSettings(false);
                  showToast("Date format updated");
                }}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[13px] outline-none dark:border-white/10 dark:bg-[#0F1B16]"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            }
          />
          <Button
            className="mt-3.5"
            onClick={() => {
              setNameDraft(org.data?.name ?? "");
              setEditingName(true);
            }}
          >
            <Edit2 className="h-[15px] w-[15px]" /> {savingSettings ? "Saving…" : "Edit details"}
          </Button>
        </Card>

        <Card padded>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[14.5px] font-bold">Team Members</p>
            <button onClick={() => setInviteOpen(true)} className="flex items-center gap-1 text-[12px] font-semibold text-brand-700 dark:text-brand-400">
              <UserPlus className="h-3.5 w-3.5" /> Invite
            </button>
          </div>
          <p className="mb-1 text-[12px] text-ink-muted">Each role can access specific BusinessOS modules.</p>
          {members.loading ? (
            <div className="h-32 animate-pulse" />
          ) : (
            members.data?.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-2 border-b border-slate-200 py-2.5 text-[13px] last:border-0 dark:border-white/10">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-700 text-[10.5px] font-bold text-white">
                    {initials(m.user.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{m.user.name}</div>
                    <div className="truncate text-[11px] text-ink-muted">{m.user.email}</div>
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <select
                    defaultValue={m.role}
                    onChange={async (e) => {
                      try {
                        await updateMemberRole(m.id, e.target.value);
                        showToast("Role updated");
                        members.refetch();
                      } catch (err) {
                        showToast(err instanceof Error ? err.message : "Couldn't update role.");
                      }
                    }}
                    className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11.5px] outline-none dark:border-white/10 dark:bg-[#0F1B16]"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {humanize(r)}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={async () => {
                      if (!confirm(`Remove ${m.user.name} from the organization?`)) return;
                      try {
                        await removeMember(m.id);
                        showToast("Member removed");
                        members.refetch();
                      } catch (err) {
                        showToast(err instanceof Error ? err.message : "Couldn't remove member.");
                      }
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-ink-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <Card padded>
          <p className="mb-1 text-[14.5px] font-bold">Preferences</p>
          <KV k="Theme" v="Light / Dark (toggle in top bar)" />
          <KV k="Timezone" v={settings.data?.timezone ?? "—"} />
        </Card>

        <Card padded>
          <p className="mb-1 text-[14.5px] font-bold">Security</p>
          <KV
            k="Two-factor authentication"
            v={
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11.5px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                Not enabled
              </span>
            }
          />
          <Button variant="primary" className="mt-3.5" onClick={() => showToast("2FA isn't wired up on the backend yet")}>
            <Shield className="h-[15px] w-[15px]" /> Enable 2FA
          </Button>
        </Card>
      </div>

      <CreateModal
        open={inviteOpen}
        title="Invite Team Member"
        fields={inviteFields}
        onClose={() => setInviteOpen(false)}
        onSubmit={async (values) => {
          if (!org.data) throw new Error("No active organization.");
          const { error } = await authClient.organization.inviteMember({
            email: values.email,
            role: values.role as never,
            organizationId: org.data.id,
          });
          if (error) throw new Error(error.message ?? "Couldn't send the invitation.");
          showToast(`Invitation sent to ${values.email}`);
        }}
      />
    </>
  );
}
