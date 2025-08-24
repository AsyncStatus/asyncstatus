import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "../../db";
import type { Db } from "../../db/db";

export function getLinearProjectTool(db: Db) {
  return tool({
    description: `Get Linear project details by projectId`,
    parameters: z.object({
      projectId: z.string().describe("The Linear project ID"),
    }),
    execute: async (params) => {
      const rows = await db
        .select({
          id: schema.linearProject.id,
          projectId: schema.linearProject.projectId,
          teamId: schema.linearProject.teamId,
          name: schema.linearProject.name,
          key: schema.linearProject.key,
          description: schema.linearProject.description,
          state: schema.linearProject.state,
          startDate: schema.linearProject.startDate,
          targetDate: schema.linearProject.targetDate,
          completedAt: schema.linearProject.completedAt,
          archivedAt: schema.linearProject.archivedAt,
          canceledAt: schema.linearProject.canceledAt,
          color: schema.linearProject.color,
          icon: schema.linearProject.icon,
          progress: schema.linearProject.progress,
          issueCount: schema.linearProject.issueCount,
          completedIssueCount: schema.linearProject.completedIssueCount,
        })
        .from(schema.linearProject)
        .where(eq(schema.linearProject.projectId, params.projectId))
        .limit(1);
      return rows[0] || null;
    },
  });
}
