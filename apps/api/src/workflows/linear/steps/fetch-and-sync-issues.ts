import { getStartOfWeek } from "@asyncstatus/dayjs";
import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import type { LinearClient } from "@linear/sdk";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { isTuple } from "../../../lib/is-tuple";

type FetchAndSyncIssuesParams = {
  linearClient: LinearClient;
  db: Db;
  integrationId: string;
  minIssueCreatedAt?: Date;
};

export async function fetchAndSyncIssues({
  linearClient,
  db,
  integrationId,
  minIssueCreatedAt,
}: FetchAndSyncIssuesParams): Promise<Set<string>> {
  const eventIds = new Set<string>();
  const filterDate = minIssueCreatedAt ?? getStartOfWeek().toDate();
  let maxIterations = 10;
  const issues = await linearClient.issues({
    filter: {
      createdAt: {
        gte: filterDate,
      },
    },
    includeArchived: false,
    first: 200,
  });
  console.log(issues.nodes.length);

  if (issues.nodes.length === 0) {
    return eventIds;
  }

  let processed = 0;
  while (maxIterations > 0) {
    const current = issues.nodes.slice(processed);
    processed = issues.nodes.length;

    const issueUpserts: any[] = [];
    for (const issue of current) {
      const team = await issue.team;
      const project = await issue.project;
      const assignee = await issue.assignee;
      const creator = await issue.creator;
      const parent = await issue.parent;
      const state = await issue.state;
      const labels = await issue.labels();
      const subscribers = await issue.subscribers();

      const labelIds = labels.nodes.map((label) => label.id).join(",");
      const subscriberIds = subscribers.nodes.map((sub) => sub.id).join(",");

      issueUpserts.push(
        db
          .insert(schema.linearIssue)
          .values({
            id: nanoid(),
            integrationId,
            issueId: issue.id,
            teamId: team?.id ?? null,
            projectId: project?.id ?? null,
            cycleId: null,
            parentId: parent?.id ?? null,
            number: issue.number,
            identifier: issue.identifier,
            title: issue.title,
            description: issue.description ?? null,
            priority: issue.priority ?? null,
            priorityLabel: issue.priorityLabel,
            estimate: issue.estimate ?? null,
            sortOrder: issue.sortOrder,
            state: state?.name ?? null,
            stateType: state?.type ?? null,
            assigneeId: assignee?.id ?? null,
            creatorId: creator?.id ?? null,
            labelIds: labelIds || null,
            subscriberIds: subscriberIds || null,
            url: issue.url,
            branchName: issue.branchName ?? null,
            customerTicketCount: issue.customerTicketCount ?? null,
            dueDate: issue.dueDate ? new Date(issue.dueDate) : null,
            completedAt: issue.completedAt ? new Date(issue.completedAt) : null,
            archivedAt: issue.archivedAt ? new Date(issue.archivedAt) : null,
            canceledAt: issue.canceledAt ? new Date(issue.canceledAt) : null,
            autoClosedAt: issue.autoClosedAt ? new Date(issue.autoClosedAt) : null,
            autoArchivedAt: issue.autoArchivedAt ? new Date(issue.autoArchivedAt) : null,
            snoozedUntilAt: issue.snoozedUntilAt ? new Date(issue.snoozedUntilAt) : null,
            startedAt: issue.startedAt ? new Date(issue.startedAt) : null,
            triagedAt: issue.triagedAt ? new Date(issue.triagedAt) : null,
            createdAt: new Date(issue.createdAt),
            updatedAt: new Date(issue.updatedAt),
          })
          .onConflictDoUpdate({
            target: schema.linearIssue.issueId,
            setWhere: eq(schema.linearIssue.integrationId, integrationId),
            set: {
              teamId: team?.id ?? null,
              projectId: project?.id ?? null,
              parentId: parent?.id ?? null,
              title: issue.title,
              description: issue.description ?? null,
              priority: issue.priority ?? null,
              priorityLabel: issue.priorityLabel,
              estimate: issue.estimate ?? null,
              sortOrder: issue.sortOrder,
              state: state?.name ?? null,
              stateType: state?.type ?? null,
              assigneeId: assignee?.id ?? null,
              labelIds: labelIds || null,
              subscriberIds: subscriberIds || null,
              url: issue.url,
              branchName: issue.branchName ?? null,
              customerTicketCount: issue.customerTicketCount ?? null,
              dueDate: issue.dueDate ? new Date(issue.dueDate) : null,
              completedAt: issue.completedAt ? new Date(issue.completedAt) : null,
              archivedAt: issue.archivedAt ? new Date(issue.archivedAt) : null,
              canceledAt: issue.canceledAt ? new Date(issue.canceledAt) : null,
              autoClosedAt: issue.autoClosedAt ? new Date(issue.autoClosedAt) : null,
              autoArchivedAt: issue.autoArchivedAt ? new Date(issue.autoArchivedAt) : null,
              snoozedUntilAt: issue.snoozedUntilAt ? new Date(issue.snoozedUntilAt) : null,
              startedAt: issue.startedAt ? new Date(issue.startedAt) : null,
              triagedAt: issue.triagedAt ? new Date(issue.triagedAt) : null,
              updatedAt: new Date(issue.updatedAt),
            },
          }),
      );
    }

    if (isTuple(issueUpserts)) {
      await db.batch(issueUpserts);
    }

    const eventBatch = current.map((issue) => {
      const eventId = nanoid();
      eventIds.add(eventId);

      return db
        .insert(schema.linearEvent)
        .values({
          id: eventId,
          integrationId,
          externalId: `${issue.id}-sync`,
          type: "issue",
          action: "sync",
          issueId: issue.id,
          issueIdentifier: issue.identifier,
          projectId: null,
          userId: null,
          teamId: null,
          payload: issue as unknown,
          webhookId: null,
          webhookTimestamp: null,
          processed: false,
          processedAt: null,
          summary: null,
          summaryError: null,
          summaryCreatedAt: null,
          createdAt: new Date(issue.createdAt),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.linearEvent.externalId,
          setWhere: eq(schema.linearEvent.integrationId, integrationId),
          set: {
            payload: issue as unknown,
            updatedAt: new Date(),
          },
        });
    });

    if (isTuple(eventBatch)) {
      await db.batch(eventBatch);
    }

    if (!issues.pageInfo.hasNextPage) {
      break;
    }
    await issues.fetchNext();
    maxIterations--;
  }

  return eventIds;
}
