import type { Db } from "@asyncstatus/db/create-db";
import type { OpenRouterProvider } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { trackAiUsage } from "../../../lib/ai-usage-kv";
import { listTeamStatusUpdatesTool } from "../../tools/list-team-status-updates-tool";
import { postProcess, type TeamSummaryResult } from "./post-process";
import { systemPrompt } from "./system-prompt";

export type SummarizeTeamStatusUpdatesOptions = {
  openRouterProvider: OpenRouterProvider;
  db: Db;
  organizationId: string;
  teamId: string;
  plan: "basic" | "startup" | "enterprise";
  kv: KVNamespace;
  aiLimits: { basic: number; startup: number; enterprise: number };
  effectiveFrom: string;
  effectiveTo: string;
};

export async function summarizeTeamStatusUpdates({
  openRouterProvider,
  db,
  organizationId,
  teamId,
  plan,
  kv,
  aiLimits,
  effectiveFrom,
  effectiveTo,
}: SummarizeTeamStatusUpdatesOptions): Promise<TeamSummaryResult> {
  const model = "openai/gpt-5-mini";

  const { text } = await generateText({
    model: openRouterProvider(model),
    seed: 123,
    maxSteps: 30,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Create a team status summary for teamId: ${teamId} in organizationId: ${organizationId} between the effectiveFrom and effectiveTo dates.\nThe effectiveFrom date is ${effectiveFrom} and the effectiveTo date is ${effectiveTo}.\n\nPlease analyze team members' status updates and create a general team summary and individual user summaries following the specified format.`,
      },
    ],
    toolChoice: "auto",
    tools: {
      listTeamStatusUpdates: listTeamStatusUpdatesTool(db),
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
