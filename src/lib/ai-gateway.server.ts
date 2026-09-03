import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Creates a provider bound to the Lovable AI Gateway.
 * Server-only: the caller passes LOVABLE_API_KEY read inside a handler.
 */
export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    name: "lovable-ai-gateway",
    apiKey,
    headers: {
      "Lovable-API-Key": apiKey,
    },
  });
}
