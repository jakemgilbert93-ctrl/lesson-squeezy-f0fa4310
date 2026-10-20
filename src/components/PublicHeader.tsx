import { LogoWordmark } from "@/components/Logo";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

import { APP_CONFIG } from "@/config/app-config";
import { useHomeSession } from "@/hooks/use-home-session";
import { Button } from "@/components/ui/button";
import { AccountDialog } from "@/components/AccountDialog";

export function PublicHeader() {
  const navigate = useNavigate();
  const signedIn = useHomeSession();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="border-b border-border bg-gradient-header">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-4 py-5 sm:flex-row sm:items-center sm:px-6">
      <Link to="/" className="flex min-w-0 items-center gap-2 text-foreground">
        <LogoWordmark
          iconSize={44}
          iconClassName="h-9 w-9 sm:h-11 sm:w-11"
          textClassName="text-[1.375rem] sm:text-[1.75rem]"
        />
        {APP_CONFIG.beta && (
          <span className="rounded-full bg-card px-2 py-0.5 text-xs font-semibold text-foreground sm:text-[0.9rem]">
            Beta
          </span>
        )}
      </Link>
      <nav className="flex flex-wrap items-center gap-3 sm:gap-5">
        {signedIn === false && <Link
          to="/pricing"
          activeProps={{ className: "font-bold underline underline-offset-4" }}
          className="text-sm font-medium text-foreground transition hover:text-foreground/80"
        >
          Pricing
        </Link>}
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
            <AccountDialog userId={signedIn} />
            <Button variant="ghost"
              type="button"
              onClick={signOut}
              className="text-sm font-medium text-foreground transition hover:text-foreground/80"
            >
              Sign out
            </Button>
          </>
        ) : (
          <>
          <Link to="/auth" className="text-sm font-medium text-foreground">Sign in</Link>
          <Button asChild><Link
            to="/auth"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Get started
          </Link></Button>
          </>
        )}
      </nav>
      </div>
    </header>
  );
}
