import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { profileKey, useMyProfile } from "@/hooks/use-my-profile";
import { saveMyDisplayName } from "@/lib/profile.functions";

export function AccountDialog({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const profile = useMyProfile(userId);
  const saveName = useServerFn(saveMyDisplayName);
  const queryClient = useQueryClient();

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await saveName({ data: { displayName: draft ?? profile.data?.displayName ?? "" } });
      queryClient.setQueryData(profileKey(userId), result);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your name.");
    } finally {
      setSaving(false);
    }
  }

  return <Dialog open={open} onOpenChange={(next) => { setOpen(next); setDraft(null); setError(""); }}>
    <DialogTrigger asChild><Button variant="ghost" size="sm"><UserRound className="h-4 w-4" />Account</Button></DialogTrigger>
    <DialogContent className="max-w-sm">
      <DialogHeader><DialogTitle>Account</DialogTitle><DialogDescription>Your display name is visible only to you.</DialogDescription></DialogHeader>
      {profile.isPending ? <p role="status" className="text-sm text-muted-foreground">Loading account…</p>
        : profile.isError ? <div><p role="alert" className="text-sm">Could not load your account.</p><Button variant="outline" onClick={() => void profile.refetch()}>Try again</Button></div>
        : <form onSubmit={save} className="space-y-4">
          <div><label htmlFor="account-display-name" className="mb-2 block text-sm font-medium">Display name</label>
            <Input id="account-display-name" name="displayName" autoComplete="name" value={draft ?? profile.data?.displayName ?? ""} onChange={(event) => setDraft(event.target.value)} disabled={saving} /></div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </form>}
    </DialogContent>
  </Dialog>;
}