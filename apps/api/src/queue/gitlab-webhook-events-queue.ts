import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import * as schema from "../db";
import { createDb } from "../db/db";
import type { Bindings } from "../lib/env";
import type { AnyGitlabWebhookEventDefinition } from "../lib/gitlab-event-definition";
import { isTuple } from "../lib/is-tuple";

export type GitlabWebhookEventsQueueMessage = AnyGitlabWebhookEventDefinition & {
  gitlab_event?: string; // Added by webhook router
};

export async function gitlabWebhookEventsQueue(
  batch: MessageBatch<GitlabWebhookEventsQueueMessage>,
  env: Bindings,
  ctx: ExecutionContext,
) {
  const db = createDb(env);
  const processedEventIds = new Set<string>();
  const batchUpserts = [];

  for (const message of batch.messages) {
    const event = message.body;
    console.log(`Processing GitLab ${event.gitlab_event || event.object_kind} event`);
    
    message.ack();

    // Skip events without project info
    if (!event.project?.id) {
      console.log("No project found in GitLab event.");
      continue;
    }

    // Find corresponding project in our database
    const project = await db.query.gitlabProject.findFirst({
      where: eq(schema.gitlabProject.projectId, event.project.id.toString()),
      with: { integration: true },
    });
    
    if (!project) {
      console.log(`GitLab project ${event.project.id} not found in database.`);
      continue;
    }

    // Skip events without user info
    if (!event.user?.id) {
      console.log("No user found in GitLab event.");
      continue;
    }

    // Generate unique event ID (GitLab doesn't provide one in webhooks)
    const eventId = generateGitlabWebhookEventId(event);
    processedEventIds.add(eventId);

    batchUpserts.push(
      db
        .insert(schema.gitlabEvent)
        .values({
          id: nanoid(),
          gitlabId: eventId,
          gitlabActorId: event.user.id.toString(),
          projectId: project.id,
          type: mapGitlabWebhookEventType(event.gitlab_event || event.object_kind),
          action: getEventAction(event),
          payload: event,
          createdAt: getEventCreatedAt(event),
          insertedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.gitlabEvent.gitlabId,
          setWhere: eq(schema.gitlabEvent.gitlabId, eventId),
          set: {
            insertedAt: new Date(),
            payload: event,
          },
        })
    );
  }

  if (isTuple(batchUpserts)) {
    await db.batch(batchUpserts);
  }

  // Send to processing queue for AI analysis
  await env.GITLAB_PROCESS_EVENTS_QUEUE.sendBatch(
    Array.from(processedEventIds).map((id) => ({
      body: id,
      contentType: "text",
    })),
  );
}

function generateGitlabWebhookEventId(event: GitlabWebhookEventsQueueMessage): string {
  // Generate a unique ID for GitLab webhook events
  const timestamp = getEventCreatedAt(event).getTime();
  const key = `${event.project?.id}_${event.gitlab_event || event.object_kind}_${event.user?.id}_${timestamp}`;
  return Buffer.from(key).toString('base64').replace(/[+/=]/g, '').substring(0, 32);
}

function getEventCreatedAt(event: GitlabWebhookEventsQueueMessage): Date {
  // Try different fields where GitLab might store the creation date
  if ('created_at' in event && event.created_at) {
    return new Date(event.created_at as string);
  }
  
  if ('object_attributes' in event && event.object_attributes && typeof event.object_attributes === 'object' && event.object_attributes !== null && 'created_at' in event.object_attributes) {
    return new Date(event.object_attributes.created_at as string);
  }

  // Fallback to current time
  return new Date();
}

function getEventAction(event: GitlabWebhookEventsQueueMessage): string | null {
  // Extract action from different GitLab event types
  if ('object_attributes' in event && event.object_attributes && typeof event.object_attributes === 'object' && event.object_attributes !== null && 'action' in event.object_attributes) {
    return event.object_attributes.action as string;
  }

  if ('object_attributes' in event && event.object_attributes && typeof event.object_attributes === 'object' && event.object_attributes !== null && 'state' in event.object_attributes) {
    return event.object_attributes.state as string;
  }

  // For push events, determine if it's a create, delete, or update
  if (event.object_kind === 'push') {
    const pushEvent = event as any;
    if (pushEvent.before === '0000000000000000000000000000000000000000') {
      return 'created';
    }
    if (pushEvent.after === '0000000000000000000000000000000000000000') {
      return 'deleted';
    }
    return 'updated';
  }

  return null;
}

function mapGitlabWebhookEventType(eventType: string | undefined): string {
  if (!eventType) return 'unknown';
  
  // Map GitLab webhook event types to our standardized types
  const eventTypeMap: Record<string, string> = {
    'push': 'push',
    'issues': 'issues', 
    'merge_request': 'merge_request',
    'wiki_page': 'wiki_page',
    'deployment': 'deployment',
    'job': 'job',
    'pipeline': 'pipeline',
    'tag_push': 'tag_push',
    'note': 'note',
    'confidential_issues': 'confidential_issues',
    'confidential_note': 'confidential_note',
    'release': 'release',
    'subgroup': 'subgroup',
    'feature_flag': 'feature_flag',
    'emoji': 'emoji',
    'resource_access_token': 'resource_access_token',
    'member': 'member',
    'push_rule': 'push_rule',
    'archive': 'archive',
    'system_hook': 'system_hook'
  };
  
  return eventTypeMap[eventType] || 'unknown';
}
