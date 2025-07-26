import type { OpenRouterProvider } from "@openrouter/ai-sdk-provider";
import { generateText, tool } from "ai";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod"; // have to use v3 for now
import type { Member, Organization } from "../db";
import * as schema from "../db";
import type { Db } from "../db/db";

export type GenerateStatusUpdateItemsOptions = {
  openRouterProvider: OpenRouterProvider;
  db: Db;
  memberId: Member["id"];
  organizationId: Organization["id"];
  effectiveFrom: string;
  effectiveTo: string;
};

export async function generateStatusUpdateItems({
  openRouterProvider,
  db,
  memberId,
  organizationId,
  effectiveFrom,
  effectiveTo,
}: GenerateStatusUpdateItemsOptions) {
  const { text } = await generateText({
    model: openRouterProvider("openai/gpt-4.1-nano"),
    maxSteps: 20,
    system: `You are an engineering assistant that writes concise status update bullet points.
Summarise the developer's activity with a keen focus on OUTCOMES and user-facing impact.
Write in the first person as the person who is writing the status update, e.g. "Removed a bug in the billing flow" instead of "Removed a bug in the billing flow".
Focus on commits and PRs and e.g. CI/CD pipelines if they're not directly related to the commits or PRs.
Group and condense similar activities into a single bullet point.
Use commit messages and the nature of changed files to INFER which product feature, module,
or section of the codebase was affected (e.g. "billing flow", "auth middleware", "mobile UI").
Avoid literal file names, but clearly mention the inferred feature/section when relevant.
Be helpful yet concise, and NEVER hallucinate. Generate UP TO 10 bullet points (fewer is better).
Use markdown to format the bullet points.

IMPORTANT: Use tools to get both GitHub and Slack events for the member between the effectiveFrom and effectiveTo dates.
- If there are NO GitHub events, do not generate any GitHub-related bullet points.
- If there are NO Slack events, do not generate any Slack-related bullet points.
- If there are NO events from either source, return "No activity found during this period."
- Only generate bullet points based on ACTUAL events returned by the tools.
- NEVER make up or infer activities that are not supported by the event data.
- You can use getGitHubEventDetail and getSlackEventDetail tools to get more specific information about individual events (e.g., PR numbers, commit messages, Slack channel names, etc.).

Make sure to condense the information to 100 words or less (less is better) and generally extract the most important information.
Example:
- Added a new feature to the billing flow.
- Fixed a bug in the auth middleware.
- Updated the mobile UI (PR #123)[https://github.com/org/repo/pull/123].`,
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
      getMemberGitHubEvents: tool({
        description: `Get the GitHub events for the member between the effectiveFrom and effectiveTo dates.`,
        parameters: z.object({
          organizationId: z.string(),
          memberId: z.string(),
          effectiveFrom: z
            .string()
            .describe("The effectiveFrom date in ISO 8601 format, e.g. 2025-01-01T00:00:00Z."),
          effectiveTo: z
            .string()
            .describe("The effectiveTo date in ISO 8601 format, e.g. 2025-01-02T00:00:00Z."),
        }),
        execute: async (params) => {
          const events = await db
            .selectDistinct({
              githubEvent: {
                id: schema.githubEvent.id,
                githubId: schema.githubEvent.githubId,
                createdAt: schema.githubEvent.createdAt,
              },
              githubEventVector: { embeddingText: schema.githubEventVector.embeddingText },
              githubUser: { id: schema.githubUser.id, login: schema.githubUser.login },
              member: { id: schema.member.id, githubId: schema.member.githubId },
            })
            .from(schema.githubEvent)
            .innerJoin(
              schema.githubRepository,
              eq(schema.githubEvent.repositoryId, schema.githubRepository.id),
            )
            .innerJoin(
              schema.githubIntegration,
              eq(schema.githubRepository.integrationId, schema.githubIntegration.id),
            )
            .innerJoin(
              schema.githubEventVector,
              eq(schema.githubEvent.id, schema.githubEventVector.eventId),
            )
            .innerJoin(
              schema.githubUser,
              and(
                eq(schema.githubUser.githubId, schema.githubEvent.githubActorId),
                eq(schema.githubUser.integrationId, schema.githubIntegration.id),
              ),
            )
            .innerJoin(schema.member, eq(schema.member.githubId, schema.githubUser.githubId))
            .where(
              and(
                eq(
                  schema.githubIntegration.organizationId,
                  params.organizationId ?? organizationId,
                ),
                eq(schema.member.id, params.memberId ?? memberId),
                gte(schema.githubEvent.createdAt, new Date(params.effectiveFrom ?? effectiveFrom)),
                lte(schema.githubEvent.createdAt, new Date(params.effectiveTo ?? effectiveTo)),
              ),
            )
            .orderBy(desc(schema.githubEvent.createdAt));
          return events;
        },
      }),
      getMemberSlackEvents: tool({
        description: `Get the Slack events for the member between the effectiveFrom and effectiveTo dates.`,
        parameters: z.object({
          organizationId: z.string(),
          memberId: z.string(),
          effectiveFrom: z
            .string()
            .describe("The effectiveFrom date in ISO 8601 format, e.g. 2025-01-01T00:00:00Z."),
          effectiveTo: z
            .string()
            .describe("The effectiveTo date in ISO 8601 format, e.g. 2025-01-02T00:00:00Z."),
        }),
        execute: async (params) => {
          const events = await db
            .selectDistinct({
              slackEvent: {
                id: schema.slackEvent.id,
                slackEventId: schema.slackEvent.slackEventId,
                createdAt: schema.slackEvent.createdAt,
              },
              slackEventVector: { embeddingText: schema.slackEventVector.embeddingText },
              slackUser: { id: schema.slackUser.id, slackUserId: schema.slackUser.slackUserId },
              member: { id: schema.member.id, slackId: schema.member.slackId },
            })
            .from(schema.slackEvent)
            .innerJoin(
              schema.slackIntegration,
              eq(schema.slackEvent.slackTeamId, schema.slackIntegration.teamId),
            )
            .innerJoin(
              schema.slackEventVector,
              eq(schema.slackEvent.id, schema.slackEventVector.eventId),
            )
            .innerJoin(
              schema.slackUser,
              eq(schema.slackEvent.slackUserId, schema.slackUser.slackUserId),
            )
            .innerJoin(schema.member, eq(schema.member.slackId, schema.slackUser.slackUserId))
            .where(
              and(
                eq(schema.slackIntegration.organizationId, params.organizationId ?? organizationId),
                eq(schema.member.id, params.memberId ?? memberId),
                gte(schema.slackEvent.createdAt, new Date(params.effectiveFrom ?? effectiveFrom)),
                lte(schema.slackEvent.createdAt, new Date(params.effectiveTo ?? effectiveTo)),
              ),
            )
            .orderBy(desc(schema.slackEvent.createdAt));
          return events;
        },
      }),
      getGitHubEventDetail: tool({
        description: `Get detailed information about a specific GitHub event by its ID, including payload data, commit messages, PR numbers, etc.`,
        parameters: z.object({
          eventId: z.string().describe("The GitHub event ID to get details for"),
        }),
        execute: async (params) => {
          const eventDetail = await db
            .select({
              githubEvent: {
                id: schema.githubEvent.id,
                githubId: schema.githubEvent.githubId,
                type: schema.githubEvent.type,
                payload: schema.githubEvent.payload,
                createdAt: schema.githubEvent.createdAt,
              },
              githubEventVector: { embeddingText: schema.githubEventVector.embeddingText },
              githubRepository: {
                name: schema.githubRepository.name,
                fullName: schema.githubRepository.fullName,
              },
              githubUser: {
                login: schema.githubUser.login,
                name: schema.githubUser.name,
              },
            })
            .from(schema.githubEvent)
            .leftJoin(
              schema.githubEventVector,
              eq(schema.githubEvent.id, schema.githubEventVector.eventId),
            )
            .leftJoin(
              schema.githubRepository,
              eq(schema.githubEvent.repositoryId, schema.githubRepository.id),
            )
            .leftJoin(
              schema.githubUser,
              eq(schema.githubEvent.githubActorId, schema.githubUser.githubId),
            )
            .where(eq(schema.githubEvent.id, params.eventId))
            .limit(1);
          return eventDetail[0] || null;
        },
      }),
      getSlackEventDetail: tool({
        description: `Get detailed information about a specific Slack event by its ID, including payload data, channel information, message content, etc.`,
        parameters: z.object({
          eventId: z.string().describe("The Slack event ID to get details for"),
        }),
        execute: async (params) => {
          const eventDetail = await db
            .select({
              slackEvent: {
                id: schema.slackEvent.id,
                slackEventId: schema.slackEvent.slackEventId,
                type: schema.slackEvent.type,
                payload: schema.slackEvent.payload,
                messageTs: schema.slackEvent.messageTs,
                threadTs: schema.slackEvent.threadTs,
                createdAt: schema.slackEvent.createdAt,
              },
              slackEventVector: { embeddingText: schema.slackEventVector.embeddingText },
              slackChannel: {
                name: schema.slackChannel.name,
                channelId: schema.slackChannel.channelId,
                isPrivate: schema.slackChannel.isPrivate,
              },
              slackUser: {
                username: schema.slackUser.username,
                displayName: schema.slackUser.displayName,
              },
            })
            .from(schema.slackEvent)
            .leftJoin(
              schema.slackEventVector,
              eq(schema.slackEvent.id, schema.slackEventVector.eventId),
            )
            .leftJoin(
              schema.slackChannel,
              eq(schema.slackEvent.channelId, schema.slackChannel.channelId),
            )
            .leftJoin(
              schema.slackUser,
              eq(schema.slackEvent.slackUserId, schema.slackUser.slackUserId),
            )
            .where(eq(schema.slackEvent.id, params.eventId))
            .limit(1);
          return eventDetail[0] || null;
        },
      }),
    },
  });

  return text.split("\n").map((line) => line.replace(/-/g, "").replace(/\.+$/, "").trim());
}
