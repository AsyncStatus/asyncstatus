import type { OpenRouterProvider } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import type * as schema from "../../../db";
import type { Db } from "../../../db/db";
import { trackAiUsage } from "../../../lib/ai-usage-kv";
import { getDiscordChannelTool } from "../tools/get-discord-channel-tool";
import { getDiscordEventDetailTool } from "../tools/get-discord-event-detail-tool";
import { getDiscordIntegrationTool } from "../tools/get-discord-integration-tool";
import { getDiscordServerTool } from "../tools/get-discord-server-tool";
import { getDiscordUserTool } from "../tools/get-discord-user-tool";
import { getExistingStatusUpdateItemsTool } from "../tools/get-existing-status-update-items-tool";
import { getGithubEventDetailTool } from "../tools/get-github-event-detail-tool";
import { getGithubRepositoryTool } from "../tools/get-github-repository-tool";
import { getGithubUserTool } from "../tools/get-github-user-tool";
import { getMemberDiscordEventsTool } from "../tools/get-member-discord-events-tool";
import { getMemberGithubEventsTool } from "../tools/get-member-github-events-tool";
import { getMemberSlackEventsTool } from "../tools/get-member-slack-events-tool";
import { getSlackChannelTool } from "../tools/get-slack-channel-tool";
import { getSlackEventDetailTool } from "../tools/get-slack-event-detail-tool";
import { getSlackIntegrationTool } from "../tools/get-slack-integration-tool";
import { getSlackUserTool } from "../tools/get-slack-user-tool";
import { postProcess } from "./post-process";
import { systemPrompt } from "./system-prompt";

export type GenerateStatusUpdateOptions = {
  openRouterProvider: OpenRouterProvider;
  db: Db;
  memberId: schema.Member["id"];
  organizationId: schema.Organization["id"];
  plan: "basic" | "startup" | "enterprise"; // for usage limits
  kv: KVNamespace; // for usage tracking
  aiLimits: { basic: number; startup: number; enterprise: number }; // AI generation limits
  effectiveFrom: string;
  effectiveTo: string;
};

export async function generateStatusUpdate({
  openRouterProvider,
  db,
  memberId,
  organizationId,
  plan,
  kv,
  aiLimits,
  effectiveFrom,
  effectiveTo,
}: GenerateStatusUpdateOptions) {
  const model = "openai/gpt-4.1-mini";

  const { text, usage } = await generateText({
    model: openRouterProvider(model),
    seed: 123,
    maxSteps: 50,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Generate status update bullet points for the member (memberId: ${memberId})
in the organization (organizationId: ${organizationId}) between the effectiveFrom and effectiveTo dates.
The effectiveFrom date is ${effectiveFrom} and the effectiveTo date is ${effectiveTo}.`,
      },
    ],
    toolChoice: "auto",
    tools: {
      getExistingStatusUpdateItems: getExistingStatusUpdateItemsTool(db),

      getMemberGitHubEvents: getMemberGithubEventsTool(db),
      getGitHubEventDetail: getGithubEventDetailTool(db),
      getGitHubUser: getGithubUserTool(db),
      getGitHubRepository: getGithubRepositoryTool(db),

      getMemberSlackEvents: getMemberSlackEventsTool(db),
      getSlackEventDetail: getSlackEventDetailTool(db),
      getSlackChannel: getSlackChannelTool(db),
      getSlackUser: getSlackUserTool(db),
      getSlackIntegration: getSlackIntegrationTool(db),

      getMemberDiscordEvents: getMemberDiscordEventsTool(db),
      getDiscordEventDetail: getDiscordEventDetailTool(db),
      getDiscordChannel: getDiscordChannelTool(db),
      getDiscordUser: getDiscordUserTool(db),
      getDiscordServer: getDiscordServerTool(db),
      getDiscordIntegration: getDiscordIntegrationTool(db),
    },
  });

  // Track AI usage with plan limits
  const usageResult = await trackAiUsage(
    kv,
    organizationId,
    "status_generation",
    plan,
    1,
    aiLimits,
  );

  if (!usageResult.success) {
    throw new Error("AI generation limit exceeded for your plan");
  }

  return postProcess(text);
}
