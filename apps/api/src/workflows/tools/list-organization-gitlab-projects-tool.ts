import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "../../db";
import type { Db } from "../../db/db";

export function listOrganizationGitlabProjectsTool(db: Db) {
  return tool({
    description: `List GitLab projects for an organization's GitLab integration. Use to map names to project IDs.`,
    parameters: z.object({
      organizationId: z.string().describe("The organization ID that owns the GitLab integration"),
    }),
    execute: async (params) => {
      const projects = await db
        .select({
          id: schema.gitlabProject.id,
          projectId: schema.gitlabProject.projectId,
          name: schema.gitlabProject.name,
          pathWithNamespace: schema.gitlabProject.pathWithNamespace,
          visibility: schema.gitlabProject.visibility,
          webUrl: schema.gitlabProject.webUrl,
          createdAt: schema.gitlabProject.createdAt,
        })
        .from(schema.gitlabProject)
        .innerJoin(
          schema.gitlabIntegration,
          eq(schema.gitlabProject.integrationId, schema.gitlabIntegration.id),
        )
        .where(eq(schema.gitlabIntegration.organizationId, params.organizationId));

      return projects;
    },
  });
}
