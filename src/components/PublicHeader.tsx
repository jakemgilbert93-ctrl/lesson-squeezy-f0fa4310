import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

import { APP_CONFIG } from "@/config/app-config";

export function PublicHeader() {
  const navigate = useNavigate();
  // null = session state not known yet; avoid flashing the wrong nav.
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSignedIn(!!data.session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "INITIAL_SESSION") {
        setSignedIn(!!session);
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="border-b border-border bg-gradient-header">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
      <Link to="/" className="flex items-center gap-2 text-lg font-bold text-foreground sm:text-xl">
        <Logo size={32} />
        <span>
          Lesson <span className="text-primary">Squeezy</span>
        </span>
        {APP_CONFIG.beta && (
          <span className="rounded-full bg-card px-2 py-0.5 text-xs font-semibold text-foreground">
            Beta
          </span>
        )}
      </Link>
      <nav className="flex items-center gap-3 sm:gap-5">
        <Link
          to="/pricing"
          activeProps={{ className: "font-bold underline underline-offset-4" }}
          className="text-sm font-medium text-foreground transition hover:text-foreground/80"
        >
          Pricing
        </Link>
        {signedIn === null ? (
          // Neutral placeholder while the session loads — no state flash.
          <span className="inline-block h-9 w-20 rounded-lg bg-muted" aria-hidden="true" />
        ) : signedIn ? (
          <>
            <Link
              to="/plans"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              My Lessons
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="text-sm font-medium text-foreground transition hover:text-foreground/80"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link
            to="/auth"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Sign in
          </Link>
        )}
      </nav>
      </div>
    </header>
  );
}
