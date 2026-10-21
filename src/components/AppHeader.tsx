import { LogoWordmark } from "@/components/Logo";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, UserRound } from "lucide-react";
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
      <Link
        to="/"
        className="flex min-w-0 items-center text-foreground max-sm:col-start-1 max-sm:row-start-1"
      >
        <LogoWordmark
          iconSize={44}
          iconClassName="h-9 w-9 sm:h-11 sm:w-11"
          textClassName="text-[1.375rem] sm:text-[1.75rem]"
        />
      </Link>
      <div className="contents sm:flex sm:flex-nowrap sm:items-center sm:gap-x-4">
        <nav className="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-2 max-sm:col-start-1 max-sm:row-start-2 max-sm:[&>button]:justify-self-start max-sm:[&>button]:px-2 max-sm:[&>button]:text-[13px] sm:col-span-1 sm:flex sm:flex-nowrap sm:gap-x-4">
          <Link
            to="/"
            activeProps={{ className: "!text-foreground font-bold underline underline-offset-4" }}
            className="text-[13px] font-medium text-foreground/80 transition hover:text-foreground sm:text-sm"
          >
            Home
          </Link>
          <Link
            to="/app"
            activeOptions={{ exact: true }}
            activeProps={{ className: "!text-foreground font-bold underline underline-offset-4" }}
            className="text-[13px] font-medium text-foreground/80 transition hover:text-foreground sm:text-sm"
          >
            New Lesson
          </Link>
          <Link
            to="/plans"
            activeProps={{ className: "!text-foreground font-bold underline underline-offset-4" }}
            className="text-[13px] font-medium text-foreground/80 transition hover:text-foreground sm:text-sm"
          >
            My Lessons
          </Link>
          <Link
            to="/account"
            activeProps={{ className: "!text-foreground font-bold underline underline-offset-4" }}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-foreground/80 transition hover:text-foreground sm:text-sm"
          >
            <UserRound className="h-4 w-4" />
            Account
          </Link>
        </nav>
        <button
          onClick={signOut}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground transition hover:bg-accent max-sm:col-start-2 max-sm:row-start-1 max-sm:justify-self-end max-sm:min-h-[40px] max-sm:border-transparent max-sm:bg-transparent max-sm:px-2 max-sm:text-[13px]"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </header>
  );
}
