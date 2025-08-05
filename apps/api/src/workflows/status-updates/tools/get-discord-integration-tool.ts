import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "../../../db";
import type { Db } from "../../../db/db";

export function getDiscordIntegrationTool(db: Db) {
  return tool({
    description: `Get details about a Discord integration for an organization.`,
    parameters: z.object({
      organizationId: z
        .string()
        .describe("The organization ID to get Discord integration details for"),
    }),
    execute: async (params) => {
      const integration = await db
        .select({
          id: schema.discordIntegration.id,
          organizationId: schema.discordIntegration.organizationId,
          botUserId: schema.discordIntegration.botUserId,
          teamId: schema.discordIntegration.teamId,
          gatewayDurableObjectId: schema.discordIntegration.gatewayDurableObjectId,
          syncStartedAt: schema.discordIntegration.syncStartedAt,
          syncCompletedAt: schema.discordIntegration.syncCompletedAt,
          lastSyncedAt: schema.discordIntegration.lastSyncedAt,
          createdAt: schema.discordIntegration.createdAt,
        })
        .from(schema.discordIntegration)
        .where(eq(schema.discordIntegration.organizationId, params.organizationId))
        .limit(1);
      return integration[0] || null;
    },
  });
}
