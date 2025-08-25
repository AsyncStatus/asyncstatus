import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

export function getGitlabIntegrationTool(db: Db) {
  return tool({
    description: "Get GitLab integration details",
    parameters: z.object({
      organizationId: z.string(),
    }),
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
