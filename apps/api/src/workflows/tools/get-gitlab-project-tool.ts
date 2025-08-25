import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

export function getGitlabProjectTool(db: Db) {
  return tool({
    description: "Get GitLab project details",
    parameters: z.object({
      projectId: z.string(),
    }),
    execute: async ({ projectId }) => {
      const project = await db.query.gitlabProject.findFirst({
        where: eq(schema.gitlabProject.id, projectId),
        columns: {
          id: true,
          projectId: true,
          name: true,
          namespace: true,
          pathWithNamespace: true,
          visibility: true,
          webUrl: true,
          description: true,
          defaultBranch: true,
        },
      });

      return project;
    },
  });
}
