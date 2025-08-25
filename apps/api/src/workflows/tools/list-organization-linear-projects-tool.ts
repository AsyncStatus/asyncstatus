import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

export function listOrganizationLinearProjectsTool(db: Db) {
  return tool({
    description: `List Linear projects for an organization's Linear integration. Use to map project names to IDs.`,
    parameters: z.object({
      organizationId: z.string().describe("The organization ID that owns the Linear integration"),
    }),
    execute: async (params) => {
      const projects = await db
        .select({
          id: schema.linearProject.id,
          projectId: schema.linearProject.projectId,
          teamId: schema.linearProject.teamId,
          name: schema.linearProject.name,
          key: schema.linearProject.key,
          createdAt: schema.linearProject.createdAt,
        })
        .from(schema.linearProject)
        .innerJoin(
          schema.linearIntegration,
          eq(schema.linearProject.integrationId, schema.linearIntegration.id),
        )
        .where(eq(schema.linearIntegration.organizationId, params.organizationId));

      return projects;
    },
  });
}
