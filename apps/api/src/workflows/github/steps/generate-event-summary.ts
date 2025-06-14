import type Anthropic from "@anthropic-ai/sdk";
import type { VoyageAIClient } from "voyageai";

import * as schema from "../../../db/schema";

type GenerateEventSummary = {
  anthropicClient: Anthropic;
  voyageClient: VoyageAIClient;
  event: typeof schema.githubEvent.$inferSelect;
};

export async function generateEventSummary({
  anthropicClient,
  voyageClient,
  event,
}: GenerateEventSummary) {
  const payload = event.payload;
  if (
    typeof payload === "object" &&
    payload !== null &&
    "commits" in payload &&
    Array.isArray(payload.commits) &&
    payload.commits.length >= 2048
  ) {
    console.log(`Event ${event.id} might have more than 2048 commits.`);
  }

  const data = JSON.stringify(payload, null, 2);
  const response = await anthropicClient.messages.create({
    model: "claude-3-5-haiku-20241022",
    system: `You are an expert technical summarizer.
Given GitHub event data payload, write a concise summary of the changes made in the event.
The event might be a push event, a pull request event or any other GitHub event.

The summary should be no more than 300 words. The summary should use natural language and be easy to understand.
The summary should be self-contained and must correctly describe the changes made, focusing on the purpose and outcome of the changes.
The summary must be self-contained, infer the purpose and outcome of the changes from the information provided.

You MUST be helpful and concise. You MUST NOT hallucinate.`,
    messages: [{ role: "user", content: data }],
    max_tokens: 8192,
  });
  if (!response.content[0] || response.content[0].type !== "text") {
    console.log(
      `Push event summary response is not a text. Expected a text response, got ${response.content[0]?.type} (${response.content.length}).`,
    );
    return { embedding: null, summary: null };
  }
  const summary = response.content[0].text;
  const embeddingResponse = await voyageClient.embed({
    input: summary,
    model: "voyage-3-large",
  });
  const embedding = embeddingResponse.data?.[0]?.embedding;
  if (!embedding) {
    console.log(
      `Failed to generate embedding. Skipping push event ${event.id}.`,
    );
    return { embedding: null, summary };
  }

  return { embedding, summary };
}
