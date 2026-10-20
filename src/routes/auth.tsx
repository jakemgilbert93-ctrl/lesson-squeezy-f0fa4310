import { LogoWordmark } from "@/components/Logo";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Lesson Squeezy" },
      {
        name: "description",
        content: "Sign in or create your Lesson Squeezy account to generate standards-aligned lesson plans.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationNeeded, setConfirmationNeeded] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/app" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setConfirmationNeeded(false);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || undefined },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        if (data.session === null) {
          setConfirmationNeeded(true);
        } else if (data.user) {
          toast.success("Account created!");
          navigate({ to: "/app" });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/app" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Brand panel */}
      <div className="bg-gradient-panel relative hidden overflow-hidden md:block md:w-1/2">
        <div className="relative flex h-full flex-col p-12 text-secondary-foreground">
          <Link to="/" className="flex items-center text-secondary-foreground">
            <LogoWordmark iconSize={56} iconClassName="h-14 w-14" textClassName="text-[2rem]" />
          </Link>

          {/* Decorative lesson-card preview */}
          <div className="pointer-events-none relative mx-auto my-8 w-full max-w-sm select-none" aria-hidden="true">
            <div className="absolute inset-0 translate-x-4 translate-y-4 -rotate-2 rounded-2xl bg-white/40 shadow-lg" />
            <div className="relative rounded-2xl border border-border/60 bg-card p-5 shadow-xl">
              <h3 className="break-words text-lg font-extrabold leading-snug text-foreground">
                Subtracting Fractions with Like Denominators
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">Grade 4 · Math · 45 min</p>
              <div className="mt-4 space-y-3">
                {[
                  { label: "Warm-up", chip: "bg-blush text-foreground", text: "Quick review of equivalent fractions", min: "10 min" },
                  { label: "Direct Instruction", chip: "bg-babyblue text-foreground", text: "Model subtracting with like denominators", min: "15 min" },
                  { label: "Guided & Independent Practice", chip: "bg-lavender text-foreground", text: "Partner work with fraction strips", min: "20 min" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-primary">{s.label}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.chip}`}>
                        <Clock className="h-3 w-3" /> {s.min}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-auto">
            <h2 className="text-balance text-4xl font-bold leading-tight">
              Lesson plans, drafted for you.
            </h2>
            <p className="mt-4 max-w-md text-secondary-foreground/90">
              Enter a topic or pick a standard, and Lesson Squeezy drafts a complete,
              classroom-ready lesson plan. Edit it, save it, download it.
            </p>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center md:hidden">
            <Link to="/" className="inline-flex items-center text-foreground">
              <LogoWordmark iconSize={40} iconClassName="h-10 w-10" textClassName="text-2xl" />
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-foreground">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to generate and manage your lesson plans."
              : "Start crafting standards-aligned lesson plans today."}
          </p>

          {confirmationNeeded ? (
            <div className="mt-6 rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm text-foreground">
              <p className="font-semibold">Check your email</p>
              <p className="mt-1 text-muted-foreground">
                We sent a confirmation link to <span className="font-medium">{email}</span>.
                Click it to activate your account, then sign in.
              </p>
              <button
                onClick={() => setMode("signin")}
                className="mt-3 text-sm font-medium text-primary hover:underline"
              >
                I've confirmed — sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Display name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ms. Rivera"
                    className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.edu"
                  className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
              >
                {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setConfirmationNeeded(false);
              }}
              className="font-semibold text-primary hover:underline"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>

          <p className="mt-4 text-center text-sm">
            <Link to="/reset-password" className="text-muted-foreground hover:text-foreground hover:underline">
              Forgot your password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
