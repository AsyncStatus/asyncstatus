import type { OpenRouterProvider } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import type { VoyageAIClient } from "voyageai";
import type { LinearEvent } from "../../../db";

type GenerateLinearEventSummaryOptions = {
  openRouterProvider: OpenRouterProvider;
  voyageClient: VoyageAIClient;
  event: LinearEvent;
};

export async function generateLinearEventSummary({
  openRouterProvider,
  voyageClient,
  event,
}: GenerateLinearEventSummaryOptions) {
  const payload = event.payload;
  const data = JSON.stringify(payload, null, 2);
  const { text } = await generateText({
    model: openRouterProvider("openai/gpt-5-nano"),
    system: `You are an expert technical summarizer for Linear events.
Given a Linear event payload (Issue, Comment, Project, Label, Cycle, User, Team, etc.), write a concise summary of what changed and why it matters.
Focus on purpose and outcome, avoid speculation, and do not hallucinate.
Keep it under 300 words, clear and self-contained.`,
    messages: [{ role: "user", content: data }],
  });

  const embeddingResponse = await voyageClient.embed({ input: text, model: "voyage-3-large" });
  const embedding = embeddingResponse.data?.[0]?.embedding;
  if (!embedding) {
    console.log(`Failed to generate embedding. Skipping Linear event ${event.id}.`);
    return { embedding: null, summary: text } as const;
  }

  return { embedding, summary: text } as const;
}
