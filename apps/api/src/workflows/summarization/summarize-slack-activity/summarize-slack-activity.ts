import type { Db } from "@asyncstatus/db/create-db";
import type { OpenRouterProvider } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { trackAiUsage } from "../../../lib/ai-usage-kv";
import { getSlackChannelTool } from "../../tools/get-slack-channel-tool";
import { getSlackEventDetailTool } from "../../tools/get-slack-event-detail-tool";
import { getSlackUserTool } from "../../tools/get-slack-user-tool";
import { listOrganizationSlackEventsTool } from "../../tools/list-organization-slack-events-tool";
import { postProcess, type SlackActivitySummaryResult } from "./post-process";
import { systemPrompt } from "./system-prompt";

export type SummarizeSlackActivityOptions = {
  openRouterProvider: OpenRouterProvider;
  db: Db;
  organizationId: string;
  channelIds?: string[]; // optional; if empty or undefined, include all channels
  plan: "basic" | "startup" | "enterprise";
  kv: KVNamespace;
  aiLimits: { basic: number; startup: number; enterprise: number };
  effectiveFrom: string;
  effectiveTo: string;
};

export async function summarizeSlackActivity({
  openRouterProvider,
  db,
  organizationId,
  channelIds = [],
  plan,
  kv,
  aiLimits,
  effectiveFrom,
  effectiveTo,
}: SummarizeSlackActivityOptions): Promise<SlackActivitySummaryResult> {
  const model = "openai/gpt-5-mini";

  const { text } = await generateText({
    model: openRouterProvider(model),
    seed: 123,
    maxSteps: 30,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Create a Slack activity summary for organizationId: ${organizationId} between the effectiveFrom and effectiveTo dates.\nThe effectiveFrom date is ${effectiveFrom} and the effectiveTo date is ${effectiveTo}.\n\nChannel filter: ${channelIds.length > 0 ? channelIds.join(",") : "ALL"}.\n\nPlease analyze the events and create a general summary and per-channel highlights following the specified format.`,
      },
    ],
    toolChoice: "auto",
    tools: {
      listOrganizationSlackEvents: listOrganizationSlackEventsTool(db),
      getSlackEventDetail: getSlackEventDetailTool(db),
      getSlackChannel: getSlackChannelTool(db),
      getSlackUser: getSlackUserTool(db),
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
