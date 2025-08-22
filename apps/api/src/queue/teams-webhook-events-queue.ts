import { generateId } from "better-auth";
import { eq } from "drizzle-orm";
import * as schema from "../db";
import { createDb } from "../db/db";
import type { HonoEnv } from "../lib/env";

interface TeamsWebhookEvent {
  subscriptionId: string;
  changeType: string;
  tenantId: string;
  clientState?: string;
  subscriptionExpirationDateTime: string;
  resource: string;
  resourceData: {
    id?: string;
    "@odata.type"?: string;
    "@odata.id"?: string;
    "@odata.etag"?: string;
    [key: string]: any;
  };
}

export async function teamsWebhookEventsQueue(
  batch: MessageBatch<TeamsWebhookEvent>,
  env: HonoEnv["Bindings"],
) {
  const db = createDb(env);

  for (const message of batch.messages) {
    try {
      const event = message.body;
      
      // Find the integration by tenant ID
      const integration = await db.query.teamsIntegration.findFirst({
        where: eq(schema.teamsIntegration.tenantId, event.tenantId),
      });

      if (!integration) {
        console.error(`No Teams integration found for tenant ${event.tenantId}`);
        message.ack();
        continue;
      }

      // Process different change types
      if (event.changeType === "created" || event.changeType === "updated") {
        // Handle new or updated messages
        if (event.resource.includes("/messages/")) {
          const messageId = event.resourceData.id;
          if (!messageId) {
            console.error("No message ID in webhook event");
            message.ack();
            continue;
          }

          // Extract team and channel IDs from the resource path
          const resourceParts = event.resource.split("/");
          const teamIndex = resourceParts.indexOf("teams");
          const channelIndex = resourceParts.indexOf("channels");
          
          if (teamIndex === -1 || channelIndex === -1) {
            console.error("Could not extract team/channel from resource path");
            message.ack();
            continue;
          }

          const teamId = resourceParts[teamIndex + 1];
          const channelId = resourceParts[channelIndex + 1];

          // Find the channel in our database
          const channel = await db.query.teamsChannel.findFirst({
            where: eq(schema.teamsChannel.channelId, channelId),
          });

          if (!channel) {
            console.error(`Channel ${channelId} not found in database`);
            message.ack();
            continue;
          }

          // Create or update the event
          const eventInsert: schema.TeamsEventInsert = {
            id: generateId(),
            integrationId: integration.id,
            eventId: messageId,
            eventType: "message",
            eventSubtype: event.changeType,
            channelId: channel.id,
            teamId: teamId,
            chatId: null,
            userId: null,
            fromUserId: null,
            memberId: null,
            parentEventId: null,
            replyToId: null,
            body: null, // Will be fetched in sync
            bodyHtml: null,
            summary: null,
            attachments: null,
            mentions: null,
            reactions: null,
            importance: "normal",
            subject: null,
            webUrl: null,
            etag: event.resourceData["@odata.etag"] ?? null,
            isDeleted: false,
            isEdited: event.changeType === "updated",
            deletedDateTime: null,
            lastModifiedDateTime: new Date(),
            createdDateTime: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await db
            .insert(schema.teamsEvent)
            .values(eventInsert)
            .onConflictDoUpdate({
              target: schema.teamsEvent.eventId,
              setWhere: eq(schema.teamsEvent.eventId, messageId),
              set: {
                eventSubtype: event.changeType,
                etag: event.resourceData["@odata.etag"] ?? null,
                isEdited: event.changeType === "updated",
                lastModifiedDateTime: new Date(),
                updatedAt: new Date(),
              },
            });

          // Queue for processing (summary generation)
          await env.TEAMS_PROCESS_EVENTS_QUEUE.send(eventInsert.id);
        }
      } else if (event.changeType === "deleted") {
        // Handle deleted messages
        if (event.resource.includes("/messages/")) {
          const messageId = event.resourceData.id;
          if (messageId) {
            await db
              .update(schema.teamsEvent)
              .set({
                isDeleted: true,
                deletedDateTime: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(schema.teamsEvent.eventId, messageId));
          }
        }
      }

      message.ack();
    } catch (error) {
      console.error("Failed to process Teams webhook event:", error);
      message.retry();
    }
  }
}