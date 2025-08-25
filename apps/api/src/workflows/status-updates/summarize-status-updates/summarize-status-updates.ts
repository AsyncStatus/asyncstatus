import type { Db } from "@asyncstatus/db/create-db";
import type { OpenRouterProvider } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { trackAiUsage } from "../../../lib/ai-usage-kv";
import { getOrganizationStatusUpdatesTool } from "../../tools/get-organization-status-updates-tool";
import { postProcess, type SummaryResult } from "./post-process";
import { systemPrompt } from "./system-prompt";

export type SummarizeStatusUpdatesOptions = {
  openRouterProvider: OpenRouterProvider;
  db: Db;
  organizationId: string;
  plan: "basic" | "startup" | "enterprise"; // for usage limits
  kv: KVNamespace; // for usage tracking
  aiLimits: { basic: number; startup: number; enterprise: number }; // AI generation limits
  effectiveFrom: string;
  effectiveTo: string;
};

export async function summarizeStatusUpdates({
  openRouterProvider,
  db,
  organizationId,
  plan,
  kv,
  aiLimits,
  effectiveFrom,
  effectiveTo,
}: SummarizeStatusUpdatesOptions): Promise<SummaryResult> {
  const model = "openai/gpt-5-mini";

  const { text, usage } = await generateText({
    model: openRouterProvider(model),
    seed: 123,
    maxSteps: 30,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Create a team status summary for the organization (organizationId: ${organizationId}) between the effectiveFrom and effectiveTo dates.
The effectiveFrom date is ${effectiveFrom} and the effectiveTo date is ${effectiveTo}.

Please analyze all team member status updates and create both a general team summary and individual user summaries following the specified format.`,
      },
    ],
    toolChoice: "auto",
    tools: {
      getOrganizationStatusUpdates: getOrganizationStatusUpdatesTool(db),
    },
  });

  // Track AI usage with plan limits
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
