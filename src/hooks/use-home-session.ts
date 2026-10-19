import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** null is unresolved; false is signed out; a string is the validated user ID. */
export function useHomeSession() {
  const [userId, setUserId] = useState<string | false | null>(null);
  useEffect(() => {
    let active = true;
    let revision = 0;
    async function resolve() {
      const current = ++revision;
      const { data, error } = await supabase.auth.getUser();
      if (active && current === revision) setUserId(error ? false : data.user?.id ?? false);
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        revision++;
        setUserId(false);
      } else if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "USER_UPDATED") {
        // Auth API calls must run outside the auth listener's lock.
        queueMicrotask(() => { if (active) void resolve(); });
      }
    });
    void resolve();
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  return userId;
}