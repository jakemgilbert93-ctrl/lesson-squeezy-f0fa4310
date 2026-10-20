import { ExternalLink } from "lucide-react";
import { APP_CONFIG } from "@/config/app-config";
import {
  STANDARDS_SOURCE_LABEL,
  STANDARD_LINK_NOTE,
  STANDARD_ONLINE_LABEL,
  standardOnlineUrl,
  standardsSourceUrl,
  type StandardSnapshot,
} from "@/lib/lesson-schema";

/** Read-only official standard. Only render when standardsActive() is true. */
export function StandardCard({ standard }: { standard: StandardSnapshot }) {
  const url = standardsSourceUrl(standard);
  const online = standardOnlineUrl(standard);
  return (
    <section aria-label="Standard" className="rounded-xl border border-border bg-muted/40 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">Standard</h3>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <p className="break-words font-mono text-sm font-semibold text-foreground">{standard.code}</p>
        <span className="text-xs font-medium text-muted-foreground">Verified standard</span>
      </div>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">{standard.standardText}</p>
      {standard.notes && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{standard.notes}</p>
      )}
      {(online || url) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          {online && (
            <a href={online} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              {STANDARD_ONLINE_LABEL} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {url && (
            <a href={url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              {STANDARDS_SOURCE_LABEL} <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}
      {(online || url) && <p className="mt-1 text-xs text-muted-foreground">{STANDARD_LINK_NOTE}</p>}
      <p className="mt-3 text-xs text-muted-foreground">{APP_CONFIG.standards.copyrightNotice}</p>
    </section>
  );
}
