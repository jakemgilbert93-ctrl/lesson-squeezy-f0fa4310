import { test } from "bun:test";
import assert from "node:assert/strict";
import type { LanguageModelUsage } from "ai";
import { captureAiUsage, type AiUsageRow } from "./ai-usage.server";

const context = { userId: "owner", feature: "material_generate" as const };
test("each successful AI call records actual input and output tokens", async () => {
  const rows: AiUsageRow[] = [];
  const usage = { inputTokens: 123, outputTokens: 45 } as LanguageModelUsage;
  const result = await captureAiUsage(async () => ({ text: "{}", usage }), context, "configured-model", async (row) => { rows.push(row); });
  assert.equal(result.usage, usage);
  assert.deepEqual(rows, [{ ...context, model: "configured-model", promptTokens: 123, completionTokens: 45 }]);
});
test("failed AI calls are logged once with unknown tokens, not zero tokens", async () => {
  const rows: AiUsageRow[] = [];
  await assert.rejects(captureAiUsage(async () => { throw new Error("Denied"); }, context, "configured-model", async (row) => { rows.push(row); }), /Denied/);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.promptTokens, null);
  assert.equal(rows[0]?.completionTokens, null);
});