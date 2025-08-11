import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "../../db";
import type { Db } from "../../db/db";

export function listOrganizationSlackChannelsTool(db: Db) {
  return tool({
    description: `List Slack channels for an organization's Slack integration. Use to map natural language channel names to IDs.`,
    parameters: z.object({
      organizationId: z.string().describe("The organization ID that owns the Slack integration"),
    }),
    execute: async (params) => {
      const channels = await db
        .select({
          id: schema.slackChannel.id,
          channelId: schema.slackChannel.channelId,
          name: schema.slackChannel.name,
          isPrivate: schema.slackChannel.isPrivate,
          isArchived: schema.slackChannel.isArchived,
          createdAt: schema.slackChannel.createdAt,
        })
        .from(schema.slackChannel)
        .innerJoin(
          schema.slackIntegration,
          eq(schema.slackChannel.integrationId, schema.slackIntegration.id),
        )
        .where(eq(schema.slackIntegration.organizationId, params.organizationId));

      return channels;
    },
  });
}
