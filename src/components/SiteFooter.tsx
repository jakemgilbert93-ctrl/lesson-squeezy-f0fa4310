import { Logo } from "@/components/Logo";
import { Link } from "@tanstack/react-router";
import { APP_CONFIG } from "@/config/app-config";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2"><Logo size={30} />© {new Date().getFullYear()} {APP_CONFIG.appName}. Built for teachers, by teachers.</p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          <Link to="/terms" className="py-1.5 transition hover:text-primary sm:py-0">Terms</Link>
          <Link to="/privacy" className="py-1.5 transition hover:text-primary sm:py-0">Privacy</Link>
          <a href={`mailto:${APP_CONFIG.feedbackEmail}`} className="py-1.5 transition hover:text-primary sm:py-0">
            Send feedback
          </a>
        </nav>
      </div>
      <p className="mx-auto max-w-6xl px-6 pb-6 text-xs text-muted-foreground">{APP_CONFIG.standards.copyrightNotice}</p>
    </footer>
  );
}
