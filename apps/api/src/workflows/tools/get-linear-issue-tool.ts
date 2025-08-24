import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "../../db";
import type { Db } from "../../db/db";

export function getLinearIssueTool(db: Db) {
  return tool({
    description: `Get Linear issue details by issueId`,
    parameters: z.object({
      issueId: z.string().describe("The Linear issue ID"),
    }),
    execute: async (params) => {
      const rows = await db
        .select({
          id: schema.linearIssue.id,
          issueId: schema.linearIssue.issueId,
          teamId: schema.linearIssue.teamId,
          projectId: schema.linearIssue.projectId,
          number: schema.linearIssue.number,
          identifier: schema.linearIssue.identifier,
          title: schema.linearIssue.title,
          description: schema.linearIssue.description,
          priority: schema.linearIssue.priority,
          priorityLabel: schema.linearIssue.priorityLabel,
          estimate: schema.linearIssue.estimate,
          state: schema.linearIssue.state,
          stateType: schema.linearIssue.stateType,
          assigneeId: schema.linearIssue.assigneeId,
          creatorId: schema.linearIssue.creatorId,
          url: schema.linearIssue.url,
          dueDate: schema.linearIssue.dueDate,
          completedAt: schema.linearIssue.completedAt,
          archivedAt: schema.linearIssue.archivedAt,
          canceledAt: schema.linearIssue.canceledAt,
          startedAt: schema.linearIssue.startedAt,
          triagedAt: schema.linearIssue.triagedAt,
          createdAt: schema.linearIssue.createdAt,
          updatedAt: schema.linearIssue.updatedAt,
        })
        .from(schema.linearIssue)
        .where(eq(schema.linearIssue.issueId, params.issueId))
        .limit(1);
      return rows[0] || null;
    },
  });
}
