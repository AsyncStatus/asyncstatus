import type { OpenRouterProvider } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import type { VoyageAIClient } from "voyageai";
import type { SlackEvent } from "../../../db";

type GenerateSlackEventSummaryOptions = {
  openRouterProvider: OpenRouterProvider;
  voyageClient: VoyageAIClient;
  event: SlackEvent;
};

export async function generateSlackEventSummary({
  openRouterProvider,
  voyageClient,
  event,
}: GenerateSlackEventSummaryOptions) {
  const payload = event.payload;
  const data = JSON.stringify(payload, null, 2);
  const { text } = await generateText({
    model: openRouterProvider("anthropic/claude-3.7-sonnet"),
    system: `You are an expert technical summarizer for Slack events.
Given Slack event data payload, write a concise summary of the changes made in the event.
The event might be a message event, a reaction event or any other Slack event.
If the event is a message event, the summary should be a summary of the message.

The summary should be no more than 300 words. The summary should use natural language and be easy to understand.
The summary should be self-contained and must correctly describe the changes made, focusing on the purpose and outcome of the changes.
The summary must be self-contained, infer the purpose and outcome of the changes from the information provided.

You MUST be helpful and concise. You MUST NOT hallucinate.`,
    messages: [{ role: "user", content: data }],
  });

  const embeddingResponse = await voyageClient.embed({ input: text, model: "voyage-3-large" });
  const embedding = embeddingResponse.data?.[0]?.embedding;
  if (!embedding) {
    console.log(`Failed to generate embedding. Skipping Slack event ${event.id}.`);
    return { embedding: null, summary: text };
  }

  return { embedding, summary: text };
}
