import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import * as schema from "../db";
import { createDb } from "../db/db";
import type { HonoEnv } from "../lib/env";
import type { LinearWebhookPayload } from "../lib/linear-client";

export async function linearWebhookEventsQueue(
  batch: MessageBatch<LinearWebhookPayload>,
  env: HonoEnv["Bindings"],
  _ctx: ExecutionContext,
): Promise<void> {
  const db = createDb(env);

  for (const message of batch.messages) {
    try {
      const payload = message.body as any;

      const integration = await db.query.linearIntegration.findFirst({
        where: eq(schema.linearIntegration.teamId, payload.organizationId ?? ""),
      });

      if (!integration) {
        console.warn(`No Linear integration found for team ${payload.organizationId}`);
        message.ack();
        continue;
      }

      let issueId: string | null = null;
      let issueIdentifier: string | null = null;
      let projectId: string | null = null;
      let teamId: string | null = null;
      let userId: string | null = null;

      if (payload.type === "Issue" && "id" in payload) {
        issueId = payload.id;
        issueIdentifier = (payload as any).identifier ?? null;
        teamId = (payload as any).teamId ?? null;
        projectId = (payload as any).projectId ?? null;
        userId = (payload as any).creatorId ?? payload.actor?.id ?? null;
      } else if (payload.type === "Project" && "id" in payload) {
        projectId = payload.id;
        teamId = (payload as any).teamId ?? null;
        userId = payload.actor?.id ?? null;
      } else if (payload.type === "Comment" && "id" in payload) {
        issueId = (payload as any).issueId ?? null;
        userId = (payload as any).userId ?? payload.actor?.id ?? null;
      } else if (payload.type === "IssueLabel" && "id" in payload) {
        issueId = (payload as any).issueId ?? null;
        userId = payload.actor?.id ?? null;
      }

      const eventId = nanoid();
      const externalId = `${payload.webhookId}-${payload.webhookTimestamp}`;

      await db
        .insert(schema.linearEvent)
        .values({
          id: eventId,
          integrationId: integration.id,
          externalId,
          type: payload.type,
          action: payload.action,
          issueId,
          issueIdentifier,
          projectId,
          userId,
          teamId,
          payload: payload as any,
          webhookId: payload.webhookId,
          webhookTimestamp: new Date(payload.webhookTimestamp),
          processed: false,
          processedAt: null,
          summary: null,
          summaryError: null,
          summaryCreatedAt: null,
          createdAt: new Date(payload.createdAt),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.linearEvent.externalId,
          setWhere: eq(schema.linearEvent.integrationId, integration.id),
          set: {
            payload: payload as any,
            updatedAt: new Date(),
          },
        });

      await env.LINEAR_PROCESS_EVENTS_QUEUE.send(eventId);

      message.ack();
    } catch (error) {
      console.error("Error processing Linear webhook event:", error);
      message.retry();
    }
  }
}
