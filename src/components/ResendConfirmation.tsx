import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { SuccessNote } from "@/components/SuccessNote";
import { supabase } from "@/integrations/supabase/client";
import { APP_CONFIG } from "@/config/app-config";
import { resendCooldownRemaining, startResendCooldown } from "@/lib/email-confirmation";

export function ResendConfirmation({ email }: { email: string }) {
  const [remaining, setRemaining] = useState(0);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setRemaining(resendCooldownRemaining());
    update();
    const interval = window.setInterval(update, 250);
    return () => window.clearInterval(interval);
  }, []);
  useEffect(() => { setSent(false); setError(null); }, [email]);

  async function resend() {
    if (sending || resendCooldownRemaining() > 0) return;
    const address = email.trim();
    if (!z.string().email().safeParse(address).success) {
      setError("Enter a valid email address to get a new link.");
      return;
    }
    setSending(true);
    setSent(false);
    setError(null);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup", email: address,
        options: { emailRedirectTo: `${APP_CONFIG.authEmailBaseUrl}/app` },
      });
      if (resendError) throw resendError;
      setRemaining(startResendCooldown());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't resend the email. Please try again.");
      if (err && typeof err === "object" && "status" in err && err.status === 429) setRemaining(startResendCooldown());
    } finally { setSending(false); }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" className="min-h-10" disabled={sending || remaining > 0} onClick={resend}>
          {sending ? "Sending…" : "Resend email"}
        </Button>
        {remaining > 0 && <span role="timer" className="text-sm text-muted-foreground">Resend in {remaining}s</span>}
      </div>
      {sent && <SuccessNote className="border-2 border-pink-deep bg-blush">Email sent again</SuccessNote>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}