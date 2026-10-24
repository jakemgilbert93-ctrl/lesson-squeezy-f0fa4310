import type { LanguageModelUsage } from "ai";

export type AiFeature = "lesson" | "lesson_regen" | "material_generate" | "material_regen";
export type AiCallContext = { userId: string; feature: AiFeature };
export type AiUsageRow = AiCallContext & {
  model: string;
  promptTokens: number | null;
  completionTokens: number | null;
};

/** One record per attempted call, including failures and locally invalid output. */
export async function captureAiUsage<T extends { usage: LanguageModelUsage }>(
  call: () => Promise<T>,
  context: AiCallContext,
  model: string,
  write: (row: AiUsageRow) => Promise<void> = writeAiUsage,
): Promise<T> {
  let usage: LanguageModelUsage | undefined;
  try {
    const result = await call();
    usage = result.usage;
    return result;
  } finally {
    await write({ ...context, model, promptTokens: usage?.inputTokens ?? null, completionTokens: usage?.outputTokens ?? null });
  }
}

async function writeAiUsage(row: AiUsageRow): Promise<void> {
  // Callers have already passed authenticated middleware; logging alone is privileged.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("ai_usage_log").insert({
    user_id: row.userId, feature: row.feature, model: row.model,
    prompt_tokens: row.promptTokens, completion_tokens: row.completionTokens,
  });
  if (error) {
    console.error("AI usage log failed:", error.message);
    throw new Error("Could not record AI usage. Please try again later.");
  }
}