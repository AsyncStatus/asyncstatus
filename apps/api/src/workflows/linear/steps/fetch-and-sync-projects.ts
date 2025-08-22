import type { LinearClient } from "@linear/sdk";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import * as schema from "../../../db";
import type { Db } from "../../../db/db";
import { isTuple } from "../../../lib/is-tuple";

type FetchAndSyncProjectsParams = {
  linearClient: LinearClient;
  db: Db;
  integrationId: string;
};

export async function fetchAndSyncProjects({
  linearClient,
  db,
  integrationId,
}: FetchAndSyncProjectsParams) {
  const projects = await linearClient.projects({
    includeArchived: false,
  });

  if (projects.nodes.length === 0) {
    return;
  }

  const batchUpserts = await Promise.all(
    projects.nodes.map(async (project) => {
      const team = await project.team;
      
      return db
        .insert(schema.linearProject)
        .values({
          id: nanoid(),
          integrationId,
          projectId: project.id,
          teamId: team?.id ?? null,
          name: project.name,
          key: project.key ?? null,
          description: project.description ?? null,
          state: project.state,
          startDate: project.startDate ? new Date(project.startDate) : null,
          targetDate: project.targetDate ? new Date(project.targetDate) : null,
          completedAt: project.completedAt ? new Date(project.completedAt) : null,
          archivedAt: project.archivedAt ? new Date(project.archivedAt) : null,
          canceledAt: project.canceledAt ? new Date(project.canceledAt) : null,
          color: project.color ?? null,
          icon: project.icon ?? null,
          progress: project.progress?.toString() ?? null,
          issueCount: project.issueCount ?? null,
          completedIssueCount: project.completedIssueCount ?? null,
          scopeChangeCount: project.scopeChangeCount ?? null,
          completedScopeChangeCount: project.completedScopeChangeCount ?? null,
          slackNewIssue: project.slackNewIssue ?? false,
          slackIssueComments: project.slackIssueComments ?? false,
          slackIssueStatuses: project.slackIssueStatuses ?? false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.linearProject.projectId,
          setWhere: eq(schema.linearProject.integrationId, integrationId),
          set: {
            teamId: team?.id ?? null,
            name: project.name,
            key: project.key ?? null,
            description: project.description ?? null,
            state: project.state,
            startDate: project.startDate ? new Date(project.startDate) : null,
            targetDate: project.targetDate ? new Date(project.targetDate) : null,
            completedAt: project.completedAt ? new Date(project.completedAt) : null,
            archivedAt: project.archivedAt ? new Date(project.archivedAt) : null,
            canceledAt: project.canceledAt ? new Date(project.canceledAt) : null,
            color: project.color ?? null,
            icon: project.icon ?? null,
            progress: project.progress?.toString() ?? null,
            issueCount: project.issueCount ?? null,
            completedIssueCount: project.completedIssueCount ?? null,
            scopeChangeCount: project.scopeChangeCount ?? null,
            completedScopeChangeCount: project.completedScopeChangeCount ?? null,
            slackNewIssue: project.slackNewIssue ?? false,
            slackIssueComments: project.slackIssueComments ?? false,
            slackIssueStatuses: project.slackIssueStatuses ?? false,
            updatedAt: new Date(),
          },
        });
    }),
  );

  if (isTuple(batchUpserts)) {
    await db.batch(batchUpserts);
  }
}