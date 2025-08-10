import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "../../db";
import type { Db } from "../../db/db";

export function listOrganizationTeamsTool(db: Db) {
  return tool({
    description: `List teams for an organization with their IDs and names. Use to map natural language to team IDs.`,
    parameters: z.object({
      organizationId: z.string().describe("The organization ID to list teams for"),
    }),
    execute: async (params) => {
      const teams = await db
        .select({
          id: schema.team.id,
          name: schema.team.name,
          createdAt: schema.team.createdAt,
          updatedAt: schema.team.updatedAt,
        })
        .from(schema.team)
        .where(eq(schema.team.organizationId, params.organizationId));
      return teams;
    },
  });
}
