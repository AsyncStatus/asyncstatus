import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import * as schema from "../../db";
import type { Db } from "../../db/db";

export function getGitlabIntegrationTool(db: Db) {
  return tool({
    description: "Get GitLab integration details",
    parameters: z.object({
      organizationId: z.string(),
    }) as any,
    execute: async ({ organizationId }) => {
      const integration = await db.query.gitlabIntegration.findFirst({
        where: eq(schema.gitlabIntegration.organizationId, organizationId),
        columns: {
          id: true,
          gitlabInstanceUrl: true,
          syncFinishedAt: true,
          syncStartedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return integration;
    },
  });
}
