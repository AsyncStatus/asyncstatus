import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

export function listOrganizationLinearTeamsTool(db: Db) {
  return tool({
    description: `List Linear teams for an organization's Linear integration. Use to map team names to IDs.`,
    parameters: z.object({
      organizationId: z.string().describe("The organization ID that owns the Linear integration"),
    }),
    execute: async (params) => {
      const teams = await db
        .select({
          id: schema.linearTeam.id,
          teamId: schema.linearTeam.teamId,
          name: schema.linearTeam.name,
          key: schema.linearTeam.key,
          timezone: schema.linearTeam.timezone,
          private: schema.linearTeam.private,
          createdAt: schema.linearTeam.createdAt,
        })
        .from(schema.linearTeam)
        .innerJoin(
          schema.linearIntegration,
          eq(schema.linearTeam.integrationId, schema.linearIntegration.id),
        )
        .where(eq(schema.linearIntegration.organizationId, params.organizationId));

      return teams;
    },
  });
}
