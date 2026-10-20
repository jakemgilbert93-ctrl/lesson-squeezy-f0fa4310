import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizeDisplayName } from "@/lib/display-name";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("profiles")
      .select("display_name").eq("user_id", context.userId).maybeSingle();
    if (error) throw new Error("Could not load your account.");
    return { displayName: normalizeDisplayName(data?.display_name) };
  });

export const saveMyDisplayName = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ displayName: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const displayName = normalizeDisplayName(data.displayName);
    const { error } = await context.supabase.from("profiles")
      .upsert({ user_id: context.userId, display_name: displayName }, { onConflict: "user_id" });
    if (error) throw new Error("Could not save your name. Please try again.");
    return { displayName };
  });