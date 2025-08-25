import type { Db } from "@asyncstatus/db/create-db";
import type { OpenRouterProvider } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { trackAiUsage } from "../../../lib/ai-usage-kv";
import { getLinearEventDetailTool } from "../../tools/get-linear-event-detail-tool";
import { getLinearUserTool } from "../../tools/get-linear-user-tool";
import { listOrganizationLinearEventsTool } from "../../tools/list-organization-linear-events-tool";
import { type LinearActivitySummaryResult, postProcess } from "./post-process";
import { systemPrompt } from "./system-prompt";

export type SummarizeLinearActivityOptions = {
  openRouterProvider: OpenRouterProvider;
  db: Db;
  organizationId: string;
  teamIds?: string[];
  projectIds?: string[];
  plan: "basic" | "startup" | "enterprise";
  kv: KVNamespace;
  aiLimits: { basic: number; startup: number; enterprise: number };
  effectiveFrom: string;
  effectiveTo: string;
};

export async function summarizeLinearActivity({
  openRouterProvider,
  db,
  organizationId,
  teamIds = [],
  projectIds = [],
  plan,
  kv,
  aiLimits,
  effectiveFrom,
  effectiveTo,
}: SummarizeLinearActivityOptions): Promise<LinearActivitySummaryResult> {
  const model = "openai/gpt-5-mini";

  const { text } = await generateText({
    model: openRouterProvider(model),
    seed: 123,
    maxSteps: 30,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Create a Linear activity summary for organizationId: ${organizationId} between the effectiveFrom and effectiveTo dates.\nThe effectiveFrom date is ${effectiveFrom} and the effectiveTo date is ${effectiveTo}.\n\nTeam filter: ${teamIds.length > 0 ? teamIds.join(",") : "ALL"}. Project filter: ${projectIds.length > 0 ? projectIds.join(",") : "ALL"}.\n\nPlease analyze the events and create a general summary and per-team/project highlights following the specified format.`,
      },
    ],
    toolChoice: "auto",
    tools: {
      listOrganizationLinearEvents: listOrganizationLinearEventsTool(db),
      getLinearEventDetail: getLinearEventDetailTool(db),
      getLinearUser: getLinearUserTool(db),
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
