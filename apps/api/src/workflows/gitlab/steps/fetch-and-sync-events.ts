import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import * as schema from "../../../db";
import type { Db } from "../../../db/db";
import { isTuple } from "../../../lib/is-tuple";

type FetchAndSyncGitlabEventsParams = {
  accessToken: string;
  instanceUrl: string;
  db: Db;
  integrationId: string;
  minEventCreatedAt: Date;
};

export async function fetchAndSyncGitlabEvents({
  accessToken,
  instanceUrl,
  db,
  integrationId,
  minEventCreatedAt,
}: FetchAndSyncGitlabEventsParams) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  };

  // Get all projects for this integration
  const projects = await db.query.gitlabProject.findMany({
    where: eq(schema.gitlabProject.integrationId, integrationId),
    columns: { id: true, projectId: true, pathWithNamespace: true },
  });

  const processedEventIds = new Set<string>();

  for (const project of projects) {
    let page = 1;
    const perPage = 100;
    let maxIterations = 10;

    while (maxIterations > 0) {
      // GitLab Events API - fetch project events
      const url = `${instanceUrl}/api/v4/projects/${project.projectId}/events?per_page=${perPage}&page=${page}&after=${minEventCreatedAt.toISOString()}`;
      const response = await fetch(url, { headers });

      if (!response.ok) {
        console.warn(`Failed to fetch events for project ${project.projectId}: ${response.status}`);
        break;
      }

      const events = await response.json();

      if (!Array.isArray(events) || events.length === 0) {
        break;
      }

      // Filter events by date
      const filteredEvents = events.filter((event) => {
        if (!event.created_at) {
          return true;
        }
        return new Date(event.created_at) > minEventCreatedAt;
      });

      if (filteredEvents.length === 0) {
        break;
      }

      try {
        const batchUpserts = filteredEvents.map((event) => {
          // Generate a unique event ID since GitLab doesn't provide one
          const eventId = generateGitlabEventId(event, project.projectId);
          processedEventIds.add(eventId);

          return db
            .insert(schema.gitlabEvent)
            .values({
              id: nanoid(),
              gitlabId: eventId,
              gitlabActorId:
                event.author?.id?.toString() || event.author_id?.toString() || "unknown",
              projectId: project.id,
              type: mapGitlabEventType(event.action_name || event.target_type),
              action: event.action_name || null,
              payload: event,
              createdAt: event.created_at ? new Date(event.created_at) : new Date(),
              insertedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: schema.gitlabEvent.gitlabId,
              setWhere: eq(schema.gitlabEvent.gitlabId, eventId),
              set: {
                insertedAt: new Date(),
                payload: event,
              },
            });
        });

        if (isTuple(batchUpserts)) {
          await db.batch(batchUpserts);
        }
      } catch (error) {
        console.error(`Error processing events for project ${project.projectId}:`, error);
      }

      // Check if there are more pages
      const totalPages = response.headers.get("X-Total-Pages");
      if (totalPages && page >= parseInt(totalPages)) {
        break;
      }

      // If we got fewer events than requested, we've reached the end
      if (filteredEvents.length < events.length) {
        break;
      }

      page++;
      maxIterations--;
    }
  }

  return processedEventIds;
}

function generateGitlabEventId(event: any, projectId: string): string {
  // GitLab events don't have unique IDs, so we generate them based on event data
  const key = `${projectId}_${event.action_name || "unknown"}_${event.author?.id || "unknown"}_${event.created_at || Date.now()}_${event.target_id || ""}`;
  return Buffer.from(key).toString("base64").replace(/[+/=]/g, "").substring(0, 32);
}

function mapGitlabEventType(eventType: string | undefined): string {
  if (!eventType) return "unknown";

  // Map GitLab Events API types to our standardized types
  const eventTypeMap: Record<string, string> = {
    pushed: "push",
    "pushed to": "push",
    deleted: "push",
    created: "push",
    updated: "push",
    opened: "issues",
    closed: "issues",
    reopened: "issues",
    commented: "note",
    accepted: "merge_request",
    merged: "merge_request",
    "opened MR": "merge_request",
    "closed MR": "merge_request",
    "reopened MR": "merge_request",
    pipeline: "pipeline",
    job: "job",
    deployment: "deployment",
    tag: "tag_push",
    wiki: "wiki_page",
    release: "release",
    feature_flag: "feature_flag",
    member: "member",
  };

  return eventTypeMap[eventType] || "unknown";
}
