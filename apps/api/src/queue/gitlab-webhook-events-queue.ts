import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import * as schema from "../db";
import { createDb } from "../db/db";
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
  ctx: ExecutionContext,
) {
  const db = createDb(env);
  const processedEventIds = new Set<string>();
  const batchUpserts = [];

  for (const message of batch.messages) {
    console.log(`Processing ${message.body.name} event`);
    processedEventIds.add(message.body.id);
    message.ack();

    const event = message.body.payload;
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

    batchUpserts.push(
      db
        .insert(schema.gitlabEvent)
        .values({
          id: nanoid(),
          gitlabId: message.body.id,
          gitlabActorId: event.user.id.toString(),
          projectId: project.id,
          type: message.body.name,
          action: getEventAction(event),
          payload: event,
          createdAt: getEventCreatedAt(event),
          insertedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.gitlabEvent.gitlabId,
          setWhere: eq(schema.gitlabEvent.gitlabId, message.body.id),
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
  if ('created_at' in event && event.created_at) {
    return new Date(event.created_at as string);
  }
  
  if ('object_attributes' in event && event.object_attributes && typeof event.object_attributes === 'object' && event.object_attributes !== null && 'created_at' in event.object_attributes) {
    return new Date(event.object_attributes.created_at as string);
  }

  // Fallback to current time
  return new Date();
}

function getEventAction(event: AnyGitlabWebhookEventDefinition): string | null {
  // Extract action from different GitLab event types
  if ('object_attributes' in event && event.object_attributes && typeof event.object_attributes === 'object' && event.object_attributes !== null) {
    const objAttrs = event.object_attributes as any;
    
    // Check for action field
    if (objAttrs.action) {
      return objAttrs.action as string;
    }
    
    // Check for state field
    if (objAttrs.state) {
      return objAttrs.state as string;
    }
    
    // Check for status field
    if (objAttrs.status) {
      return objAttrs.status as string;
    }
  }

  // For push events
  if ('before' in event && 'after' in event) {
    if (event.before === '0000000000000000000000000000000000000000') {
      return 'created';
    }
    if (event.after === '0000000000000000000000000000000000000000') {
      return 'deleted';
    }
    return 'updated';
  }
  
  // For pipeline events
  if ('object_kind' in event && event.object_kind === 'pipeline') {
    const pipelineEvent = event as any;
    if (pipelineEvent.object_attributes?.status) {
      return pipelineEvent.object_attributes.status;
    }
  }
  
  // For job events
  if ('object_kind' in event && event.object_kind === 'job') {
    const jobEvent = event as any;
    if (jobEvent.build_status) {
      return jobEvent.build_status;
    }
  }
  
  // For deployment events
  if ('object_kind' in event && event.object_kind === 'deployment') {
    const deploymentEvent = event as any;
    if (deploymentEvent.object_attributes?.status) {
      return deploymentEvent.object_attributes.status;
    }
  }

  return null;
}
