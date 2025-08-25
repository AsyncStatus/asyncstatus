import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

export function getLinearTeamTool(db: Db) {
  return tool({
    description: `Get Linear team details by teamId`,
    parameters: z.object({
      teamId: z.string().describe("The Linear team ID"),
    }),
    execute: async (params) => {
      const rows = await db
        .select({
          id: schema.linearTeam.id,
          teamId: schema.linearTeam.teamId,
          name: schema.linearTeam.name,
          key: schema.linearTeam.key,
          description: schema.linearTeam.description,
          private: schema.linearTeam.private,
          icon: schema.linearTeam.icon,
          color: schema.linearTeam.color,
          timezone: schema.linearTeam.timezone,
          issueCount: schema.linearTeam.issueCount,
        })
        .from(schema.linearTeam)
        .where(eq(schema.linearTeam.teamId, params.teamId))
        .limit(1);
      return rows[0] || null;
    },
  });
}
