import { LogoWordmark } from "@/components/Logo";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

export function AppHeader() {
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth" });
  }

  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-border bg-gradient-header px-4 py-3.5 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:px-6 sm:py-4">
      <Link to="/" className="flex min-w-0 items-center text-foreground">
        <LogoWordmark
          iconSize={44}
          iconClassName="h-9 w-9 sm:h-11 sm:w-11"
          textClassName="text-[1.375rem] sm:text-[1.75rem]"
        />
      </Link>
      <nav className="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-2 sm:col-span-1 sm:flex-nowrap">
        <Link
          to="/"
          activeProps={{ className: "!text-foreground font-bold underline underline-offset-4" }}
          className="text-sm font-medium text-foreground/80 transition hover:text-foreground"
        >
          Home
        </Link>
        <Link
          to="/app"
          activeOptions={{ exact: true }}
          activeProps={{ className: "!text-foreground font-bold underline underline-offset-4" }}
          className="text-sm font-medium text-foreground/80 transition hover:text-foreground"
        >
          New Lesson
        </Link>
        <Link
          to="/plans"
          activeProps={{ className: "!text-foreground font-bold underline underline-offset-4" }}
          className="text-sm font-medium text-foreground/80 transition hover:text-foreground"
        >
          My Lessons
        </Link>
        <button
          onClick={signOut}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground transition hover:bg-accent"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </nav>
    </header>
  );
}
