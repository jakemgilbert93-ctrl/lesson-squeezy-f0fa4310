import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { APP_CONFIG, limitsFor } from "@/config/app-config";
import type { Database, Json } from "@/integrations/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { GenerateMaterialInput, RegenerateMaterialInput, MaterialItemType } from "./materials-schema";

async function reserveMaterialCall(sb: SupabaseClient<Database>) {
  const { data: ok, error } = await sb.rpc("reserve_ai_call", {
    p_max: APP_CONFIG.limits.aiCallsPerWindow, p_window_seconds: APP_CONFIG.limits.aiWindowSeconds,
  });
  if (error) throw new Error("Could not check the AI rate limit.");
  if (!ok) throw new Error("You're going a little fast. Please wait a minute and try again.");
}

export const generateMaterialItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenerateMaterialInput.parse(input))
  .handler(async ({ data, context }) => {
    const { loadMaterialLesson, generateMaterial } = await import("./materials-ai.server");
    const { supabase: sb, userId } = context;
    const source = await loadMaterialLesson(sb, data.lessonId, userId);
    const { data: existing, error: lookupError } = await sb.from("lesson_materials_items").select("id")
      .eq("lesson_id", data.lessonId).eq("user_id", userId).eq("item_type", data.itemType).maybeSingle();
    if (lookupError) throw new Error("Could not check existing materials.");
    if (existing) throw new Error("This material already exists. Regenerate it instead.");
    await reserveMaterialCall(sb);
    // Monthly cap (Free 1 / Pro 30) is picked in the database from profiles.plan;
    // keep it in sync with src/config/app-config.ts.
    const { data: reserved, error: reserveError } = await sb.rpc("increment_monthly_materials");
    if (reserveError) throw new Error("Could not check your monthly materials limit.");
    if (reserved === null) throw new Error("You've used all your materials for this month. They reset on the 1st.");
    try {
      const result = await generateMaterial(source, data.itemType, { userId, feature: "material_generate" }, false);
      const { data: item, error } = await sb.from("lesson_materials_items").insert({
        lesson_id: data.lessonId, user_id: userId, item_type: data.itemType,
        title: result.title, content: result.content as unknown as Json, answer_key: result.answerKey,
      }).select("*").single();
      if (error || !item) throw new Error(error?.code === "23505" ? "This material already exists. Regenerate it instead." : "Could not save the material.");
      return { item, usage: result.usage };
    } catch (err) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.rpc("refund_monthly_materials", { p_user_id: userId });
      throw err;
    }
  });

export const regenerateMaterialItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RegenerateMaterialInput.parse(input))
  .handler(async ({ data, context }) => {
    const { loadMaterialLesson, generateMaterial } = await import("./materials-ai.server");
    const { supabase: sb, userId } = context;
    const { data: existing, error: lookupError } = await sb.from("lesson_materials_items").select("*")
      .eq("id", data.itemId).eq("user_id", userId).single();
    if (lookupError || !existing) throw new Error("Material not found.");
    const source = await loadMaterialLesson(sb, existing.lesson_id, userId);
    const { data: profile, error: profileError } = await sb.from("profiles").select("plan").eq("user_id", userId).single();
    if (profileError || !profile) throw new Error("Could not check your plan.");
    const limit = limitsFor(profile.plan === "pro" ? "pro" : "free").regensPerMaterial;
    if (existing.regeneration_count >= limit) throw new Error(`This material has used all ${limit} regenerations.`);
    await reserveMaterialCall(sb);
    // Only this verified server path can supply the configured cap to the privileged RPC.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: count, error: countError } = await supabaseAdmin.rpc("increment_material_regeneration", { p_item_id: existing.id, p_limit: limit });
    if (countError) throw new Error("Could not reserve a material regeneration.");
    if (count === null) throw new Error(`This material has used all ${limit} regenerations.`);
    try {
      const result = await generateMaterial(source, MaterialItemType.parse(existing.item_type), { userId, feature: "material_regen" }, true);
      const { data: item, error } = await sb.from("lesson_materials_items").update({
        title: result.title, content: result.content as unknown as Json, answer_key: result.answerKey,
      }).eq("id", existing.id).eq("user_id", userId).eq("regeneration_count", count).select("*").single();
      if (error || !item) throw new Error("Could not save the regenerated material; a newer regeneration may be in progress.");
      return { item, regenerationCount: count, regenLimit: limit, usage: result.usage };
    } catch (err) {
      await supabaseAdmin.rpc("refund_material_regeneration", { p_item_id: existing.id });
      throw err;
    }
  });