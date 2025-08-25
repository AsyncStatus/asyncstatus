import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

export function getGithubIntegrationTool(db: Db) {
  return tool({
    description: `Get details about a GitHub integration for an organization.`,
    parameters: z.object({
      organizationId: z.string().describe("The organization ID to get GitHub integration for"),
    }),
    execute: async (params) => {
      const integration = await db
        .select({
          id: schema.githubIntegration.id,
          organizationId: schema.githubIntegration.organizationId,
          installationId: schema.githubIntegration.installationId,
          syncUpdatedAt: schema.githubIntegration.syncUpdatedAt,
          createdAt: schema.githubIntegration.createdAt,
        })
        .from(schema.githubIntegration)
        .where(eq(schema.githubIntegration.organizationId, params.organizationId))
        .limit(1);
      return integration[0] || null;
    },
  });
}
