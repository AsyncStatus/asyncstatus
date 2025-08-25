import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

export function listOrganizationDiscordChannelsTool(db: Db) {
  return tool({
    description: `List Discord channels for an organization's Discord integration. Use to map natural language channel names to IDs.`,
    parameters: z.object({
      organizationId: z.string().describe("The organization ID that owns the Discord integration"),
    }),
    execute: async (params) => {
      const channels = await db
        .select({
          id: schema.discordChannel.id,
          channelId: schema.discordChannel.channelId,
          name: schema.discordChannel.name,
          type: schema.discordChannel.type,
          guildId: schema.discordChannel.guildId,
          isArchived: schema.discordChannel.isArchived,
          createdAt: schema.discordChannel.createdAt,
        })
        .from(schema.discordChannel)
        .innerJoin(
          schema.discordServer,
          eq(schema.discordChannel.serverId, schema.discordServer.id),
        )
        .innerJoin(
          schema.discordIntegration,
          eq(schema.discordServer.integrationId, schema.discordIntegration.id),
        )
        .where(eq(schema.discordIntegration.organizationId, params.organizationId));

      return channels;
    },
  });
}
