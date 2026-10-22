import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PasswordVisibilityToggle } from "@/components/PasswordVisibilityToggle";
import { PasswordRequirements } from "@/components/PasswordRequirements";
import { passwordErrorMessage, passwordRuleError } from "@/lib/password-change";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Lesson Squeezy" },
      { name: "description", content: "Reset your Lesson Squeezy account password." },
      { property: "og:title", content: "Reset password — Lesson Squeezy" },
      { property: "og:description", content: "Reset your Lesson Squeezy account password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

type Mode = "unknown" | "email" | "recovery";

function detectRecovery(): boolean {
  if (typeof window === "undefined") return false;
  const hash = new URLSearchParams(window.location.hash.replace("#", "?"));
  const query = new URLSearchParams(window.location.search);
  return hash.get("type") === "recovery" || query.get("type") === "recovery";
}

function ResetPasswordPage() {
  const [mode, setMode] = useState<Mode>("unknown");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sent, setSent] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Detect recovery mode immediately, before the auth client clears the code from the URL.
    setMode(detectRecovery() ? "recovery" : "email");
    // Also listen for the sign-in service's password-recovery event.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("recovery");
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Reset link sent. Check your email.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    const ruleError = passwordRuleError(newPassword);
    if (ruleError) {
      toast.error(ruleError);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setUpdated(true);
      toast.success("Password updated!");
    } catch (err) {
      toast.error(passwordErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-foreground">Reset password</h1>
        {mode === "unknown" ? null : mode === "recovery" ? (
          updated ? (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Your password has been updated. You can now sign in with your new password.
              </p>
              <Link
                to="/auth"
                className="block w-full rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Go to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="mt-6 space-y-4">
              <p className="text-sm text-muted-foreground">Enter your new password below.</p>
              <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                aria-label="New password"
                aria-describedby="reset-password-rules"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full rounded-lg border border-input bg-card py-2.5 pl-3.5 pr-12 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
              <PasswordVisibilityToggle show={showPassword} onToggle={() => setShowPassword((v) => !v)} label="New password" />
              </div>
              <PasswordRequirements id="reset-password-rules" password={newPassword} />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
              >
                {loading ? "Updating…" : "Update password"}
              </button>
            </form>
          )
        ) : sent ? (
          <p className="mt-6 text-sm text-muted-foreground">
            If an account exists for <span className="font-medium text-foreground">{email}</span>,
            a reset link is on its way. Can’t find it? Check your spam or junk folder.
          </p>
        ) : (
          <form onSubmit={handleRequest} className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter your email and we'll send you a link to reset your password.
            </p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu"
              className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
