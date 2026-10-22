import { Check } from "lucide-react";
import type { ReactNode } from "react";

/** Shared success box: baby blue with dark plum text and a check icon. */
export function SuccessNote({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div role="status" className={`flex flex-wrap items-center gap-2 rounded-lg bg-notice px-3 py-2 text-sm text-notice-foreground ${className}`}>
      <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
      {children}
    </div>
  );
}
