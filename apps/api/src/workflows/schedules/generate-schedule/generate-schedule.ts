import type { OpenRouterProvider } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import type { Db } from "../../../db/db";
import { createOrganizationScheduleTool } from "../../tools/create-organization-schedule-tool";
import { getDiscordIntegrationTool } from "../../tools/get-discord-integration-tool";
import { getGithubIntegrationTool } from "../../tools/get-github-integration-tool";
import { getGitlabIntegrationTool } from "../../tools/get-gitlab-integration-tool";
import { getLinearIntegrationTool } from "../../tools/get-linear-integration-tool";
import { getSlackIntegrationTool } from "../../tools/get-slack-integration-tool";
import { listOrganizationDiscordChannelsTool } from "../../tools/list-organization-discord-channels-tool";
import { listOrganizationGithubRepositoriesTool } from "../../tools/list-organization-github-repositories-tool";
import { listOrganizationGitlabProjectsTool } from "../../tools/list-organization-gitlab-projects-tool";
import { listOrganizationLinearProjectsTool } from "../../tools/list-organization-linear-projects-tool";
import { listOrganizationLinearTeamsTool } from "../../tools/list-organization-linear-teams-tool";
import { listOrganizationMembersTool } from "../../tools/list-organization-members-tool";
import { listOrganizationSlackChannelsTool } from "../../tools/list-organization-slack-channels-tool";
import { listOrganizationTeamsTool } from "../../tools/list-organization-teams-tool";
import { systemPrompt } from "./system-prompt";

export type GenerateScheduleOptions = {
  openRouterProvider: OpenRouterProvider;
  db: Db;
  organizationId: string;
  createdByMemberId?: string;
  naturalLanguageRequest: string;
};

export async function generateSchedule({
  openRouterProvider,
  db,
  organizationId,
  createdByMemberId,
  naturalLanguageRequest,
}: GenerateScheduleOptions) {
  const org = await db.query.organization.findFirst({
    where: (org, { eq }) => eq(org.id, organizationId),
    columns: { id: true, slug: true, name: true },
  });
  if (!org) {
    throw new Error("Organization not found");
  }

  const { text } = await generateText({
    model: openRouterProvider("openai/gpt-5-mini"),
    maxSteps: 40,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Create a schedule for organizationId=${org.id} (slug=${org.slug}).
Created by member id: ${createdByMemberId ?? ""}.
Request: "${naturalLanguageRequest}"`,
      },
    ],
    toolChoice: "auto",
    tools: {
      listOrganizationTeams: listOrganizationTeamsTool(db),
      listOrganizationMembers: listOrganizationMembersTool(db),
      listOrganizationGithubRepositories: listOrganizationGithubRepositoriesTool(db),
      listOrganizationSlackChannels: listOrganizationSlackChannelsTool(db),
      listOrganizationDiscordChannels: listOrganizationDiscordChannelsTool(db),
      listOrganizationGitlabProjects: listOrganizationGitlabProjectsTool(db),
      listOrganizationLinearTeams: listOrganizationLinearTeamsTool(db),
      listOrganizationLinearProjects: listOrganizationLinearProjectsTool(db),
      getSlackIntegration: getSlackIntegrationTool(db),
      getDiscordIntegration: getDiscordIntegrationTool(db),
      getGithubIntegration: getGithubIntegrationTool(db),
      getGitlabIntegration: getGitlabIntegrationTool(db),
      getLinearIntegration: getLinearIntegrationTool(db),
      createOrganizationSchedule: createOrganizationScheduleTool(db),
    },
  });

  return text;
}
