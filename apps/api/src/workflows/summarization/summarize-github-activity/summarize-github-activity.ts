import type { OpenRouterProvider } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import type { Db } from "../../../db/db";
import { trackAiUsage } from "../../../lib/ai-usage-kv";
import { getGithubEventDetailTool } from "../../tools/get-github-event-detail-tool";
import { getGithubRepositoryTool } from "../../tools/get-github-repository-tool";
import { getGithubUserTool } from "../../tools/get-github-user-tool";
import { listOrganizationGithubEventsTool } from "../../tools/list-organization-github-events-tool";
import { type GithubActivitySummaryResult, postProcess } from "./post-process";
import { systemPrompt } from "./system-prompt";

export type SummarizeGithubActivityOptions = {
  openRouterProvider: OpenRouterProvider;
  db: Db;
  organizationId: string;
  repositoryIds?: string[]; // optional; if empty or undefined, include all repos
  plan: "basic" | "startup" | "enterprise";
  kv: KVNamespace;
  aiLimits: { basic: number; startup: number; enterprise: number };
  effectiveFrom: string;
  effectiveTo: string;
};

export async function summarizeGithubActivity({
  openRouterProvider,
  db,
  organizationId,
  repositoryIds = [],
  plan,
  kv,
  aiLimits,
  effectiveFrom,
  effectiveTo,
}: SummarizeGithubActivityOptions): Promise<GithubActivitySummaryResult> {
  const model = "openai/gpt-5-mini";

  const { text } = await generateText({
    model: openRouterProvider(model),
    seed: 123,
    maxSteps: 30,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Create a GitHub activity summary for organizationId: ${organizationId} between the effectiveFrom and effectiveTo dates.\nThe effectiveFrom date is ${effectiveFrom} and the effectiveTo date is ${effectiveTo}.\n\nRepositories filter: ${repositoryIds.length > 0 ? repositoryIds.join(",") : "ALL"}.\n\nPlease analyze the events and create a general summary and per-repository highlights following the specified format.`,
      },
    ],
    toolChoice: "auto",
    tools: {
      listOrganizationGithubEvents: listOrganizationGithubEventsTool(db),
      getGithubUser: getGithubUserTool(db),
      getGithubRepository: getGithubRepositoryTool(db),
      getGithubEventDetail: getGithubEventDetailTool(db),
    },
  });

  const usageResult = await trackAiUsage(
    kv,
    organizationId,
    "summary_generation",
    plan,
    1,
    aiLimits,
  );

  if (!usageResult.success) {
    throw new Error("AI generation limit exceeded for your plan");
  }

  return postProcess(text);
}
