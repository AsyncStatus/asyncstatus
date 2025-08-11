import type { OpenRouterProvider } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import type { Db } from "../../../db/db";
import { trackAiUsage } from "../../../lib/ai-usage-kv";
import { listUserStatusUpdatesTool } from "../../tools/list-user-status-updates-tool";
import { postProcess, type UserSummaryResult } from "./post-process";
import { systemPrompt } from "./system-prompt";

export type SummarizeUserStatusUpdatesOptions = {
  openRouterProvider: OpenRouterProvider;
  db: Db;
  organizationId: string;
  userId: string;
  plan: "basic" | "startup" | "enterprise";
  kv: KVNamespace;
  aiLimits: { basic: number; startup: number; enterprise: number };
  effectiveFrom: string;
  effectiveTo: string;
};

export async function summarizeUserStatusUpdates({
  openRouterProvider,
  db,
  organizationId,
  userId,
  plan,
  kv,
  aiLimits,
  effectiveFrom,
  effectiveTo,
}: SummarizeUserStatusUpdatesOptions): Promise<UserSummaryResult> {
  const model = "openai/gpt-5-mini";

  const { text } = await generateText({
    model: openRouterProvider(model),
    seed: 123,
    maxSteps: 30,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Create a user status summary for userId: ${userId} in organizationId: ${organizationId} between the effectiveFrom and effectiveTo dates.\nThe effectiveFrom date is ${effectiveFrom} and the effectiveTo date is ${effectiveTo}.\n\nPlease analyze the user's status updates and create one general summary and several item bullets following the specified format.`,
      },
    ],
    toolChoice: "auto",
    tools: {
      listUserStatusUpdates: listUserStatusUpdatesTool(db),
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
