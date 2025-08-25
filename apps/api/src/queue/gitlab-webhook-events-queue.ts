import * as schema from "@asyncstatus/db";
import { createDb } from "@asyncstatus/db/create-db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { Bindings } from "../lib/env";
import type { AnyGitlabWebhookEventDefinition } from "../lib/gitlab-event-definition";
import { isTuple } from "../lib/is-tuple";

export type GitlabWebhookEventsQueueMessage = {
  id: string;
  name: string;
  payload: AnyGitlabWebhookEventDefinition;
};

export async function gitlabWebhookEventsQueue(
  batch: MessageBatch<GitlabWebhookEventsQueueMessage>,
  env: Bindings,
  _ctx: ExecutionContext,
) {
  const db = createDb(env);
  const processedEventIds = new Set<string>();
  const batchUpserts = [];

  for (const message of batch.messages) {
    const event = message.body as any;
    console.log(`Processing ${getGitlabEventName(event)} event`);
    const id = nanoid();
    const gitlabId = nanoid();
    processedEventIds.add(gitlabId);
    message.ack();

    if (!event.project?.id) {
      console.log("No project found in GitLab event.");
      continue;
    }

    const project = await db.query.gitlabProject.findFirst({
      where: eq(schema.gitlabProject.projectId, event.project.id.toString()),
      with: { integration: true },
    });

    if (!project) {
      console.log(`GitLab project ${event.project.id} not found in database.`);
      continue;
    }

    batchUpserts.push(
      db
        .insert(schema.gitlabEvent)
        .values({
          id,
          gitlabId,
          gitlabActorId: getGitlabActorIdFromQueueMessage(message.body),
          projectId: project.id,
          type: getGitlabEventName(event),
          action: getActionName(event),
          payload: JSON.parse(JSON.stringify(event)),
          createdAt: getEventCreatedAt(event),
          insertedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.gitlabEvent.gitlabId,
          setWhere: eq(schema.gitlabEvent.gitlabId, gitlabId),
          set: {
            insertedAt: new Date(),
            payload: JSON.parse(JSON.stringify(event)),
          },
        }),
    );
  }

  if (isTuple(batchUpserts)) {
    try {
      await db.batch(batchUpserts);
    } catch (error) {
      console.error("Error inserting GitLab events:", error);
      throw error;
    }
  }

  // Send to processing queue for AI analysis
  if (processedEventIds.size > 0) {
    await env.GITLAB_PROCESS_EVENTS_QUEUE.sendBatch(
      Array.from(processedEventIds).map((id) => ({
        body: id,
        contentType: "text",
      })),
    );
  } else {
    console.log("No events processed, skipping sendBatch.");
  }
}

function getEventCreatedAt(event: AnyGitlabWebhookEventDefinition): Date {
  // Try different fields where GitLab might store the creation date
  if ("created_at" in event && event.created_at) {
    return new Date(event.created_at as string);
  }

  if (
    "object_attributes" in event &&
    event.object_attributes &&
    typeof event.object_attributes === "object" &&
    event.object_attributes !== null &&
    "created_at" in event.object_attributes
  ) {
    return new Date(event.object_attributes.created_at as string);
  }

  // Fallback to current time
  return new Date();
}

function getGitlabActorId(event: AnyGitlabWebhookEventDefinition): string {
  // Prefer explicit user field if present
  const anyEvent = event as unknown as Record<string, unknown>;
  if ("user" in anyEvent && isRecord(anyEvent.user)) {
    const user = anyEvent.user as Record<string, unknown>;
    if (typeof user.id === "number") return String(user.id);
  }

  // Push events expose user_id at the top level
  if (typeof (anyEvent as Record<string, unknown>).user_id === "number") {
    return String((anyEvent as Record<string, unknown>).user_id);
  }

  // Many events include author_id in object_attributes
  if ("object_attributes" in anyEvent && isRecord(anyEvent.object_attributes)) {
    const attrs = anyEvent.object_attributes as Record<string, unknown>;
    if (typeof attrs.author_id === "number") return String(attrs.author_id);
  }

  // Pipeline builds may include a user per build; take the first available
  if (Array.isArray((anyEvent as Record<string, unknown>).builds)) {
    const builds = (anyEvent as Record<string, unknown>).builds as unknown[];
    for (const build of builds) {
      if (isRecord(build) && isRecord(build.user) && typeof build.user.id === "number") {
        return String(build.user.id);
      }
    }
  }

  // Fallback when actor is not provided (system/webhook-triggered)
  return "webhook";
}

function getGitlabActorIdFromQueueMessage(
  message: GitlabWebhookEventsQueueMessage | AnyGitlabWebhookEventDefinition,
): string {
  const event = hasPayload(message) ? message.payload : message;
  return getGitlabActorId(event as AnyGitlabWebhookEventDefinition);
}

function getGitlabEventName(event: AnyGitlabWebhookEventDefinition): string {
  const anyEvent = event as unknown as Record<string, unknown> | undefined | null;
  if (anyEvent && typeof anyEvent.object_kind === "string") return anyEvent.object_kind;
  if (anyEvent && typeof anyEvent.event_type === "string") return anyEvent.event_type;
  return "unknown";
}

function getActionName(event: AnyGitlabWebhookEventDefinition): string | null {
  const anyEvent = event as unknown as Record<string, unknown>;
  if (typeof anyEvent.action_name === "string" && anyEvent.action_name) {
    return anyEvent.action_name;
  }
  if (
    isRecord(anyEvent.object_attributes) &&
    typeof anyEvent.object_attributes.action === "string"
  ) {
    return anyEvent.object_attributes.action as string;
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function hasPayload(value: unknown): value is GitlabWebhookEventsQueueMessage {
  return isRecord(value) && "payload" in value;
}
