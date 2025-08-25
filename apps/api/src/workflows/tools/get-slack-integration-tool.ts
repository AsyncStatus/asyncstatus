import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { tool } from "ai";
import { eq } from "drizzle-orm";
import z from "zod";

export function getSlackIntegrationTool(db: Db) {
  return tool({
    description: `Get Slack integration details including team name for constructing Slack links.`,
    parameters: z.object({
      organizationId: z.string().describe("The organization ID to get the Slack integration for"),
    }),
    execute: async (params) => {
      const integration = await db
        .select({
          id: schema.slackIntegration.id,
          teamId: schema.slackIntegration.teamId,
          teamName: schema.slackIntegration.teamName,
          enterpriseName: schema.slackIntegration.enterpriseName,
        })
        .from(schema.slackIntegration)
        .where(eq(schema.slackIntegration.organizationId, params.organizationId))
        .limit(1);
      return integration[0] || null;
    },
  });
}
