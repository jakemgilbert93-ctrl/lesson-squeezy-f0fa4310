import { Link } from "@tanstack/react-router";
import { APP_CONFIG } from "@/config/app-config";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} {APP_CONFIG.appName}. Built for teachers.</p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          <Link to="/terms" className="transition hover:text-primary">Terms</Link>
          <Link to="/privacy" className="transition hover:text-primary">Privacy</Link>
          <a href={`mailto:${APP_CONFIG.feedbackEmail}`} className="transition hover:text-primary">
            Send feedback
          </a>
        </nav>
      </div>
    </footer>
  );
}
