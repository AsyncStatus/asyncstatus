import type { OpenRouterProvider } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import type { Db } from "../../../db/db";
import { trackAiUsage } from "../../../lib/ai-usage-kv";
import { getDiscordChannelTool } from "../../tools/get-discord-channel-tool";
import { getDiscordEventDetailTool } from "../../tools/get-discord-event-detail-tool";
import { getDiscordUserTool } from "../../tools/get-discord-user-tool";
import { listOrganizationDiscordEventsTool } from "../../tools/list-organization-discord-events-tool";
import { type DiscordActivitySummaryResult, postProcess } from "./post-process";
import { systemPrompt } from "./system-prompt";

export type SummarizeDiscordActivityOptions = {
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

export async function summarizeDiscordActivity({
  openRouterProvider,
  db,
  organizationId,
  channelIds = [],
  plan,
  kv,
  aiLimits,
  effectiveFrom,
  effectiveTo,
}: SummarizeDiscordActivityOptions): Promise<DiscordActivitySummaryResult> {
  const model = "openai/gpt-5-mini";

  const { text } = await generateText({
    model: openRouterProvider(model),
    seed: 123,
    maxSteps: 30,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Create a Discord activity summary for organizationId: ${organizationId} between the effectiveFrom and effectiveTo dates.\nThe effectiveFrom date is ${effectiveFrom} and the effectiveTo date is ${effectiveTo}.\n\nChannel filter: ${channelIds.length > 0 ? channelIds.join(",") : "ALL"}.\n\nPlease analyze the events and create a general summary and per-channel highlights following the specified format.`,
      },
    ],
    toolChoice: "auto",
    tools: {
      listOrganizationDiscordEvents: listOrganizationDiscordEventsTool(db),
      getDiscordEventDetail: getDiscordEventDetailTool(db),
      getDiscordChannel: getDiscordChannelTool(db),
      getDiscordUser: getDiscordUserTool(db),
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
