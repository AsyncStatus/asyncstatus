import { generateText } from "ai";
import type { OpenRouterProvider } from "@openrouter/ai-sdk-provider";
import type { VoyageAIClient } from "voyageai";
import type { GitlabEvent } from "../../../db";

type GenerateGitlabEventSummaryOptions = {
  openRouterProvider: OpenRouterProvider;
  voyageClient: VoyageAIClient;
  event: GitlabEvent;
};

export async function generateGitlabEventSummary({
  openRouterProvider,
  voyageClient,
  event,
}: GenerateGitlabEventSummaryOptions) {
  const payload = event.payload;
  
  // Check for extremely large payloads (similar to GitHub implementation)
  if (
    typeof payload === "object" &&
    payload !== null &&
    "commits" in payload &&
    Array.isArray(payload.commits) &&
    payload.commits.length >= 2048
  ) {
    console.log(`GitLab event ${event.id} might have more than 2048 commits.`);
  }

  const data = JSON.stringify(payload, null, 2);
  const { text } = await generateText({
    model: openRouterProvider("openai/gpt-5-nano"),
    system: `You are an expert technical summarizer for GitLab events.
Given GitLab event data payload, write a concise summary of the changes made in the event.
The event might be a push event, a merge request event, an issue event, a pipeline event, or any other GitLab event.

The summary should be no more than 300 words. The summary should use natural language and be easy to understand.
The summary should be self-contained and must correctly describe the changes made, focusing on the purpose and outcome of the changes.
The summary must be self-contained, infer the purpose and outcome of the changes from the information provided.

You MUST be helpful and concise. You MUST NOT hallucinate.

Focus on:
- The type of activity (merge request, push, issue, pipeline, etc.)
- The project/repository context
- The specific changes or outcomes
- Any relevant details like branch names, commit messages, or issue titles`,
    messages: [{ role: "user", content: data }],
  });

  const embeddingResponse = await voyageClient.embed({ input: text, model: "voyage-3-large" });
  const embedding = embeddingResponse.data?.[0]?.embedding;
  if (!embedding) {
    console.log(`Failed to generate embedding. Skipping GitLab event ${event.id}.`);
    return { embedding: null, summary: text };
  }

  return { embedding, summary: text };
}
