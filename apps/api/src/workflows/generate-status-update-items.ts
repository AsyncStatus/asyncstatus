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
    maxSteps: 5,
    system: `You are an engineering assistant that writes concise status update bullet points.
Summarise the developer's GitHub activity with a keen focus on OUTCOMES and user-facing impact.
Focus on commits and PRs and e.g. CI/CD pipelines if they're not directly related to the commits or PRs.
Use commit messages and the nature of changed files to INFER which product feature, module,
or section of the codebase was affected (e.g. "billing flow", "auth middleware", "mobile UI").
Avoid literal file names, but clearly mention the inferred feature/section when relevant.
Be helpful yet concise, and NEVER hallucinate. Generate UP TO 10 bullet points (fewer is better).
Use markdown to format the bullet points.
Use tools to get the GitHub events for the member between the effectiveFrom and effectiveTo dates and use the information to generate the status update bullet points.
The tool will return a list of GitHub event summaries for the member between the effectiveFrom and effectiveTo dates.
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
    },
  });

  return text.split("\n").map((line) => line.trim().replace(/-/g, "").replace(/\.+$/, ""));
}
