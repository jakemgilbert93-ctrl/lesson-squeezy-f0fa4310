import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_CONFIG } from "@/config/app-config";
import { profileKey, useMyProfile } from "@/hooks/use-my-profile";
import { saveMyDisplayName } from "@/lib/profile.functions";
import { getUsage } from "@/lib/lesson-plan.functions";
import { supabase } from "@/integrations/supabase/client";
import { PASSWORD_MESSAGES, passwordErrorMessage, validatePasswordChange } from "@/lib/password-change";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "Account — Lesson Squeezy" },
      { name: "description", content: "Manage your Lesson Squeezy profile, password, and plan." },
      { property: "og:title", content: "Account — Lesson Squeezy" },
      { property: "og:description", content: "Your Lesson Squeezy account settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountPage,
});

const card = "rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6";
const scrollIntoView = (e: React.FocusEvent<HTMLInputElement>) => {
  const el = e.currentTarget;
  setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 300);
};

function AccountPage() {
  const { user } = Route.useRouteContext();
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8 pb-[40vh] sm:px-6 sm:pb-16">
        <h1 className="text-3xl font-bold text-foreground">Account</h1>
        <ProfileCard userId={user.id} email={user.email ?? ""} />
        <PasswordCard />
        <PlanCard userId={user.id} />
        <section className={card} aria-labelledby="delete-heading">
          <h2 id="delete-heading" className="text-xl font-bold text-foreground">Delete account</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            To delete your account, email{" "}
            <a href={`mailto:${APP_CONFIG.feedbackEmail}`} className="inline-flex min-h-10 items-center font-semibold text-primary hover:underline">{APP_CONFIG.feedbackEmail}</a>. We will delete your account within 30 days.
          </p>
        </section>
      </main>
    </div>
  );
}

function ProfileCard({ userId, email }: { userId: string; email: string }) {
  const profile = useMyProfile(userId);
  const saveName = useServerFn(saveMyDisplayName);
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setStatus(null);
    try {
      const result = await saveName({ data: { displayName: draft ?? profile.data?.displayName ?? "" } });
      queryClient.setQueryData(profileKey(userId), result);
      setDraft(null);
      setStatus({ ok: true, text: "Saved." });
    } catch (err) {
      setStatus({ ok: false, text: err instanceof Error ? err.message : "Could not save your name." });
    } finally { setSaving(false); }
  }

  return (
    <section className={card} aria-labelledby="profile-heading">
      <h2 id="profile-heading" className="text-xl font-bold text-foreground">Profile</h2>
      {profile.isPending ? <p role="status" className="mt-3 text-sm text-muted-foreground">Loading…</p>
        : profile.isError ? <div className="mt-3"><p role="alert" className="text-sm">Could not load your account.</p><Button variant="outline" className="mt-3 min-h-10" onClick={() => void profile.refetch()}>Try again</Button></div>
        : <form onSubmit={save} className="mt-4 space-y-4">
          <div>
            <label htmlFor="account-display-name" className="mb-1.5 block text-sm font-medium">Display name</label>
            <Input id="account-display-name" name="displayName" autoComplete="name" className="h-10" value={draft ?? profile.data?.displayName ?? ""} onChange={(e) => { setDraft(e.target.value); setStatus(null); }} onFocus={scrollIntoView} disabled={saving} />
            <p className="mt-1.5 text-xs text-muted-foreground">Your display name is visible only to you.</p>
          </div>
          <div>
            <label htmlFor="account-email" className="mb-1.5 block text-sm font-medium">Email</label>
            <Input id="account-email" type="email" className="h-10 bg-muted [overflow-wrap:anywhere]" value={email} readOnly aria-readonly="true" />
          </div>
          {status && <p role={status.ok ? "status" : "alert"} className={status.ok ? "text-sm text-success" : "text-sm text-destructive"}>{status.text}</p>}
          <Button type="submit" className="min-h-10" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </form>}
    </section>
  );
}

function PasswordField({ id, label, value, onChange, autoComplete }: { id: string; label: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      <div className="relative">
        <Input id={id} type={show ? "text" : "password"} autoComplete={autoComplete} className="h-10 pr-12" value={value} onChange={(e) => onChange(e.target.value)} onFocus={scrollIntoView} />
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} aria-pressed={show}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function PasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const invalid = validatePasswordChange(current, next, confirm);
    if (invalid) { setStatus({ ok: false, text: invalid }); return; }
    setBusy(true); setStatus(null);
    const { error } = await supabase.auth.updateUser({ password: next, current_password: current });
    setBusy(false);
    if (error) { setStatus({ ok: false, text: passwordErrorMessage(error) }); return; }
    setCurrent(""); setNext(""); setConfirm("");
    setStatus({ ok: true, text: PASSWORD_MESSAGES.success });
  }

  return (
    <section className={card} aria-labelledby="password-heading">
      <h2 id="password-heading" className="text-xl font-bold text-foreground">Change password</h2>
      <form onSubmit={submit} noValidate className="mt-4 space-y-4">
        <PasswordField id="current-password" label="Current password" autoComplete="current-password" value={current} onChange={(v) => { setCurrent(v); setStatus(null); }} />
        <PasswordField id="new-password" label="New password" autoComplete="new-password" value={next} onChange={(v) => { setNext(v); setStatus(null); }} />
        <PasswordField id="confirm-password" label="Confirm new password" autoComplete="new-password" value={confirm} onChange={(v) => { setConfirm(v); setStatus(null); }} />
        <p className="text-xs text-muted-foreground">At least {APP_CONFIG.passwordMinLength} characters.</p>
        {status && <p role={status.ok ? "status" : "alert"} className={status.ok ? "text-sm text-success" : "text-sm text-destructive"}>{status.text}</p>}
        <Button type="submit" className="min-h-10" disabled={busy}>{busy ? "Changing…" : "Change password"}</Button>
      </form>
    </section>
  );
}

function PlanCard({ userId }: { userId: string }) {
  const fetchUsage = useServerFn(getUsage);
  const usage = useQuery({ queryKey: ["home-usage", userId], queryFn: () => fetchUsage() });
  const current = usage.data;
  return (
    <section className={card} aria-labelledby="plan-heading">
      <h2 id="plan-heading" className="text-xl font-bold text-foreground">Plan and usage</h2>
      {usage.isPending ? <p role="status" className="mt-3 text-sm text-muted-foreground">Loading plan…</p>
        : usage.isError ? <div className="mt-3"><p role="alert" className="text-sm">Could not load your plan.</p><Button variant="outline" className="mt-3 min-h-10" onClick={() => void usage.refetch()}>Try again</Button></div>
        : current && <div className="mt-4">
          <p className="font-semibold text-foreground">Current plan: {APP_CONFIG.plans[current.plan].name}</p>
          <p className="mt-2 text-sm text-muted-foreground">{current.monthlyLimit === null ? `${current.lessonsUsed} lessons used this month · No monthly lesson limit` : `${current.lessonsUsed} of ${current.monthlyLimit} lessons used this month`}</p>
          {current.monthlyLimit !== null && <progress aria-label="Monthly lesson usage" className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted accent-primary [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary" max={Math.max(1, current.monthlyLimit)} value={current.lessonsUsed} />}
          <p className="mt-3 text-sm text-muted-foreground">Resets on the 1st of each month at 00:00 UTC.</p>
          <Button asChild variant="link" className="mt-1 min-h-10 px-0"><Link to="/pricing">See pricing<ArrowRight /></Link></Button>
        </div>}
    </section>
  );
}
