import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { APP_CONFIG } from "@/config/app-config";

export function PublicHeader() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
      <Link to="/" className="flex items-center gap-2 text-lg font-bold text-foreground sm:text-xl">
        <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
        <span>
          Lesson <span className="text-primary">Squeezy</span>
        </span>
        {APP_CONFIG.beta && (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
            Beta
          </span>
        )}
      </Link>
      <nav className="flex items-center gap-3 sm:gap-5">
        <Link
          to="/pricing"
          activeProps={{ className: "text-primary font-semibold" }}
          className="text-sm text-muted-foreground transition hover:text-foreground"
        >
          Pricing
        </Link>
        <Link
          to="/auth"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Sign in
        </Link>
      </nav>
    </header>
  );
}
