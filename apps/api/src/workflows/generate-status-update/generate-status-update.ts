import type { OpenRouterProvider } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import type * as schema from "../../db";
import type { Db } from "../../db/db";
import { postProcess } from "./post-process";
import { systemPrompt } from "./system-prompt";
import { getGithubEventDetailTool } from "./tools/get-github-event-detail-tool";
import { getGithubRepositoryTool } from "./tools/get-github-repository-tool";
import { getGithubUserTool } from "./tools/get-github-user-tool";
import { getMemberGithubEventsTool } from "./tools/get-member-github-events-tool";
import { getMemberSlackEventsTool } from "./tools/get-member-slack-events-tool";
import { getSlackChannelTool } from "./tools/get-slack-channel-tool";
import { getSlackEventDetailTool } from "./tools/get-slack-event-detail-tool";
import { getSlackIntegrationTool } from "./tools/get-slack-integration-tool";
import { getSlackUserTool } from "./tools/get-slack-user-tool";

export type GenerateStatusUpdateOptions = {
  openRouterProvider: OpenRouterProvider;
  db: Db;
  memberId: schema.Member["id"];
  organizationId: schema.Organization["id"];
  effectiveFrom: string;
  effectiveTo: string;
};

export async function generateStatusUpdate({
  openRouterProvider,
  db,
  memberId,
  organizationId,
  effectiveFrom,
  effectiveTo,
}: GenerateStatusUpdateOptions) {
  const { text } = await generateText({
    model: openRouterProvider("openai/gpt-4.1-mini"),
    seed: 123,
    maxSteps: 30,
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
      getMemberGitHubEvents: getMemberGithubEventsTool(db),
      getGitHubEventDetail: getGithubEventDetailTool(db),
      getGitHubUser: getGithubUserTool(db),
      getGitHubRepository: getGithubRepositoryTool(db),

      getMemberSlackEvents: getMemberSlackEventsTool(db),
      getSlackEventDetail: getSlackEventDetailTool(db),
      getSlackChannel: getSlackChannelTool(db),
      getSlackUser: getSlackUserTool(db),
      getSlackIntegration: getSlackIntegrationTool(db),
    },
  });

  return postProcess(text);
}
