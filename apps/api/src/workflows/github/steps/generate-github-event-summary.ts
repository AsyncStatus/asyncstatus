import type { OpenRouterProvider } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import type { VoyageAIClient } from "voyageai";
import type { GithubEvent } from "../../../db";

type GenerateGithubEventSummaryOptions = {
  openRouterProvider: OpenRouterProvider;
  voyageClient: VoyageAIClient;
  event: GithubEvent;
};

export async function generateGithubEventSummary({
  openRouterProvider,
  voyageClient,
  event,
}: GenerateGithubEventSummaryOptions) {
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
  const { text } = await generateText({
    model: openRouterProvider("openai/gpt-5-nano"),
    system: `You are an expert technical summarizer for GitHub events.
Given GitHub event data payload, write a concise summary of the changes made in the event.
The event might be a push event, a pull request event or any other GitHub event.

The summary should be no more than 300 words. The summary should use natural language and be easy to understand.
The summary should be self-contained and must correctly describe the changes made, focusing on the purpose and outcome of the changes.
The summary must be self-contained, infer the purpose and outcome of the changes from the information provided.

You MUST be helpful and concise. You MUST NOT hallucinate.`,
    messages: [{ role: "user", content: data }],
  });

  const embeddingResponse = await voyageClient.embed({ input: text, model: "voyage-3-large" });
  const embedding = embeddingResponse.data?.[0]?.embedding;
  if (!embedding) {
    console.log(`Failed to generate embedding. Skipping push event ${event.id}.`);
    return { embedding: null, summary: text };
  }

  return { embedding, summary: text };
}
