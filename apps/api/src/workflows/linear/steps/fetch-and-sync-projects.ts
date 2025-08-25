import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import type { LinearClient } from "@linear/sdk";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
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
  const projects = await linearClient.projects({ includeArchived: false, first: 200 });
  let maxIterations = 10;

  if (projects.nodes.length === 0) {
    return;
  }

  let processed = 0;
  while (maxIterations > 0) {
    const current = projects.nodes.slice(processed);
    processed = projects.nodes.length;

    const batchUpserts = current.map((project) => {
      return db
        .insert(schema.linearProject)
        .values({
          id: nanoid(),
          integrationId,
          projectId: project.id,
          teamId: null,
          name: project.name,
          key: project.slugId ?? null,
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
          issueCount: null,
          completedIssueCount: null,
          scopeChangeCount: null,
          completedScopeChangeCount: null,
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
            teamId: null,
            name: project.name,
            key: project.slugId ?? null,
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
            issueCount: null,
            completedIssueCount: null,
            scopeChangeCount: null,
            completedScopeChangeCount: null,
            slackNewIssue: project.slackNewIssue ?? false,
            slackIssueComments: project.slackIssueComments ?? false,
            slackIssueStatuses: project.slackIssueStatuses ?? false,
            updatedAt: new Date(),
          },
        });
    });

    if (isTuple(batchUpserts)) {
      await db.batch(batchUpserts);
    }

    if (!projects.pageInfo.hasNextPage) {
      break;
    }
    await projects.fetchNext();
    maxIterations--;
  }
}
