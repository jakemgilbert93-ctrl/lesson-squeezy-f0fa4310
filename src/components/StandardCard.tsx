import { ExternalLink } from "lucide-react";
import { APP_CONFIG } from "@/config/app-config";
import type { StandardSnapshot } from "@/lib/lesson-schema";

/** Read-only official standard. Only render when standardsActive() is true. */
export function StandardCard({ standard }: { standard: StandardSnapshot }) {
  return (
    <section aria-label="Standard" className="rounded-xl border border-border bg-muted/40 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">Standard</h3>
      <p className="mt-2 font-mono text-sm font-semibold text-foreground">{standard.code}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{standard.standardText}</p>
      {standard.notes && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{standard.notes}</p>
      )}
      {standard.sourceUrl && (
        <a
          href={standard.sourceUrl}
          target="_blank"
          rel="noopener"
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View on corestandards.org <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
      <p className="mt-3 text-xs text-muted-foreground">{APP_CONFIG.standards.copyrightNotice}</p>
    </section>
  );
}
