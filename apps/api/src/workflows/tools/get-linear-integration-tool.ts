import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "../../db";
import type { Db } from "../../db/db";

export function getLinearIntegrationTool(db: Db) {
  return tool({
    description: `Get Linear integration details including team info for constructing links or defaults.`,
    parameters: z.object({
      organizationId: z.string().describe("The organization ID to get the Linear integration for"),
    }),
    execute: async (params) => {
      const integration = await db
        .select({
          id: schema.linearIntegration.id,
          teamId: schema.linearIntegration.teamId,
          teamName: schema.linearIntegration.teamName,
          teamKey: schema.linearIntegration.teamKey,
          createdAt: schema.linearIntegration.createdAt,
          updatedAt: schema.linearIntegration.updatedAt,
        })
        .from(schema.linearIntegration)
        .where(eq(schema.linearIntegration.organizationId, params.organizationId))
        .limit(1);
      return integration[0] || null;
    },
  });
}
