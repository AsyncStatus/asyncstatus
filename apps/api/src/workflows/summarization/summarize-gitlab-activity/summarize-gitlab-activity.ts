import type { OpenRouterProvider } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import type { Db } from "../../../db/db";
import { trackAiUsage } from "../../../lib/ai-usage-kv";
import { getGitlabEventDetailTool } from "../../tools/get-gitlab-event-detail-tool";
import { getGitlabProjectTool } from "../../tools/get-gitlab-project-tool";
import { getGitlabUserTool } from "../../tools/get-gitlab-user-tool";
import { listOrganizationGitlabEventsTool } from "../../tools/list-organization-gitlab-events-tool";
import { type GitlabActivitySummaryResult, postProcess } from "./post-process";
import { systemPrompt } from "./system-prompt";

export type SummarizeGitlabActivityOptions = {
  openRouterProvider: OpenRouterProvider;
  db: Db;
  organizationId: string;
  projectIds?: string[]; // optional; if empty or undefined, include all projects
  plan: "basic" | "startup" | "enterprise";
  kv: KVNamespace;
  aiLimits: { basic: number; startup: number; enterprise: number };
  effectiveFrom: string;
  effectiveTo: string;
};

export async function summarizeGitlabActivity({
  openRouterProvider,
  db,
  organizationId,
  projectIds = [],
  plan,
  kv,
  aiLimits,
  effectiveFrom,
  effectiveTo,
}: SummarizeGitlabActivityOptions): Promise<GitlabActivitySummaryResult> {
  const model = "openai/gpt-5-mini";

  const { text } = await generateText({
    model: openRouterProvider(model),
    seed: 123,
    maxSteps: 30,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Create a GitLab activity summary for organizationId: ${organizationId} between the effectiveFrom and effectiveTo dates.\nThe effectiveFrom date is ${effectiveFrom} and the effectiveTo date is ${effectiveTo}.\n\nProjects filter: ${projectIds.length > 0 ? projectIds.join(",") : "ALL"}.\n\nPlease analyze the events and create a general summary and per-project highlights following the specified format.`,
      },
    ],
    toolChoice: "auto",
    tools: {
      listOrganizationGitlabEvents: listOrganizationGitlabEventsTool(db),
      getGitlabUser: getGitlabUserTool(db),
      getGitlabProject: getGitlabProjectTool(db),
      getGitlabEventDetail: getGitlabEventDetailTool(db),
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
