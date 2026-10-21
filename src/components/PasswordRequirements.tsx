import { Check, Circle } from "lucide-react";
import { PASSWORD_REQUIREMENT, passwordChecks } from "@/lib/password-change";

export function PasswordRequirements({ password, id }: { password: string; id: string }) {
  return (
    <div id={id} className="mt-1.5 text-xs text-muted-foreground">
      <p>{PASSWORD_REQUIREMENT}</p>
      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1" aria-label="Password checklist">
        {passwordChecks(password).map((c) => (
          <li key={c.label} className={`inline-flex items-center gap-1 ${c.met ? "font-semibold text-success" : ""}`}>
            {c.met ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Circle className="h-3 w-3" aria-hidden="true" />}
            {c.label}<span className="sr-only">{c.met ? " (done)" : " (not yet)"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
