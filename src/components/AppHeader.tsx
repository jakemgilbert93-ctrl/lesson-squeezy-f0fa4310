import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, LogOut } from "lucide-react";
import { toast } from "sonner";

export function AppHeader() {
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  }

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3.5">
      <Link to="/app" className="flex items-center gap-2 text-lg font-bold text-foreground">
        <Sparkles className="h-5 w-5 text-violet" />
        Teacher's <span className="rainbow-text">Pet</span>
      </Link>
      <nav className="flex items-center gap-4">
        <Link
          to="/app"
          activeOptions={{ exact: true }}
          activeProps={{ className: "text-violet font-semibold" }}
          className="text-sm text-muted-foreground transition hover:text-foreground"
        >
          New Lesson
        </Link>
        <Link
          to="/plans"
          activeProps={{ className: "text-violet font-semibold" }}
          className="text-sm text-muted-foreground transition hover:text-foreground"
        >
          My Lessons
        </Link>
        <button
          onClick={signOut}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground transition hover:bg-accent"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </nav>
    </header>
  );
}
