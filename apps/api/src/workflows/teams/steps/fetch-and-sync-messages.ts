import { generateId } from "better-auth";
import { and, eq, gte } from "drizzle-orm";
import * as schema from "../../../db";
import type { Db } from "../../../db/db";
import { isTuple } from "../../../lib/is-tuple";
import { GraphApiPagedResponse, makeGraphApiRequest } from "./common";

type FetchAndSyncMessagesParams = {
  db: Db;
  integrationId: string;
  graphAccessToken: string;
  tenantId: string;
  deltaLink?: string | null;
  minEventCreatedAt?: Date;
};

interface ChatMessage {
  id: string;
  replyToId?: string;
  etag: string;
  messageType: string;
  createdDateTime: string;
  lastModifiedDateTime?: string;
  lastEditedDateTime?: string;
  deletedDateTime?: string;
  subject?: string;
  summary?: string;
  chatId?: string;
  importance?: string;
  locale?: string;
  webUrl?: string;
  channelIdentity?: {
    teamId?: string;
    channelId?: string;
  };
  from?: {
    user?: {
      id?: string;
      displayName?: string;
      userIdentityType?: string;
    };
  };
  body?: {
    contentType?: string;
    content?: string;
  };
  attachments?: Array<{
    id?: string;
    contentType?: string;
    contentUrl?: string;
    content?: string;
    name?: string;
    thumbnailUrl?: string;
  }>;
  mentions?: Array<{
    id?: number;
    mentionText?: string;
    mentioned?: {
      user?: {
        id?: string;
        displayName?: string;
        userIdentityType?: string;
      };
    };
  }>;
  reactions?: Array<{
    reactionType?: string;
    createdDateTime?: string;
    user?: {
      user?: {
        id?: string;
        displayName?: string;
      };
    };
  }>;
}

export async function fetchAndSyncMessages({
  db,
  integrationId,
  graphAccessToken,
  tenantId,
  deltaLink,
  minEventCreatedAt,
}: FetchAndSyncMessagesParams): Promise<Set<string>> {
  const eventIds = new Set<string>();
  const integration = await db.query.teamsIntegration.findFirst({
    where: eq(schema.teamsIntegration.id, integrationId),
    with: {
      channels: true,
    },
  });

  if (!integration || !integration.channels || integration.channels.length === 0) {
    console.log("No channels found for integration");
    return eventIds;
  }

  let newDeltaLink: string | null = null;

  // Process messages for each channel
  for (const channel of integration.channels) {
    try {
      // Use delta query if available, otherwise fetch all messages
      const endpoint = deltaLink
        ? deltaLink
        : `/teams/${channel.teamId}/channels/${channel.channelId}/messages/delta`;

      const response = await makeGraphApiRequest<GraphApiPagedResponse<ChatMessage>>(
        endpoint,
        graphAccessToken
      );

      const messages = response.value;
      newDeltaLink = response["@odata.deltaLink"] || null;

      // Get existing users and members for matching
      const users = await db.query.teamsUser.findMany({
        where: eq(schema.teamsUser.integrationId, integrationId),
      });
      const userMap = new Map(users.map((u) => [u.userId, u.id]));

      const members = await db.query.member.findMany({
        where: eq(schema.member.organizationId, integration.organizationId),
      });

      const messagesToInsert: schema.TeamsEventInsert[] = [];

      for (const message of messages) {
        // Skip if message is too old
        if (
          minEventCreatedAt &&
          new Date(message.createdDateTime) < minEventCreatedAt
        ) {
          continue;
        }

        const fromUserId = message.from?.user?.id;
        const userId = fromUserId ? userMap.get(fromUserId) : null;

        // Try to match member by email or Teams user ID
        let memberId: string | null = null;
        if (userId) {
          const teamsUser = users.find((u) => u.id === userId);
          if (teamsUser?.email) {
            const member = members.find((m) => m.email === teamsUser.email);
            memberId = member?.id ?? null;
          }
        }

        const eventInsert: schema.TeamsEventInsert = {
          id: generateId(),
          integrationId,
          eventId: message.id,
          eventType: "message",
          eventSubtype: message.messageType,
          channelId: channel.id,
          teamId: channel.teamId,
          chatId: message.chatId ?? null,
          userId,
          fromUserId: fromUserId ?? null,
          memberId,
          parentEventId: null, // Will be updated for replies
          replyToId: message.replyToId ?? null,
          body: message.body?.contentType === "text" ? message.body.content ?? null : null,
          bodyHtml: message.body?.contentType === "html" ? message.body.content ?? null : null,
          summary: message.summary ?? null,
          attachments: message.attachments ? JSON.stringify(message.attachments) : null,
          mentions: message.mentions ? JSON.stringify(message.mentions) : null,
          reactions: message.reactions ? JSON.stringify(message.reactions) : null,
          importance: message.importance ?? "normal",
          subject: message.subject ?? null,
          webUrl: message.webUrl ?? null,
          etag: message.etag,
          isDeleted: !!message.deletedDateTime,
          isEdited: !!message.lastEditedDateTime,
          deletedDateTime: message.deletedDateTime ? new Date(message.deletedDateTime) : null,
          lastModifiedDateTime: message.lastModifiedDateTime
            ? new Date(message.lastModifiedDateTime)
            : null,
          createdDateTime: new Date(message.createdDateTime),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        messagesToInsert.push(eventInsert);
        eventIds.add(eventInsert.id);
      }

      // Batch upsert messages
      const batchUpserts = messagesToInsert.map((message) => {
        return db
          .insert(schema.teamsEvent)
          .values(message)
          .onConflictDoUpdate({
            target: schema.teamsEvent.eventId,
            setWhere: eq(schema.teamsEvent.eventId, message.eventId),
            set: {
              body: message.body,
              bodyHtml: message.bodyHtml,
              summary: message.summary,
              attachments: message.attachments,
              mentions: message.mentions,
              reactions: message.reactions,
              importance: message.importance,
              subject: message.subject,
              webUrl: message.webUrl,
              etag: message.etag,
              isDeleted: message.isDeleted,
              isEdited: message.isEdited,
              deletedDateTime: message.deletedDateTime,
              lastModifiedDateTime: message.lastModifiedDateTime,
              updatedAt: new Date(),
            },
          });
      });

      if (isTuple(batchUpserts)) {
        await db.batch(batchUpserts);
      }

      // Handle replies - update parentEventId for messages with replyToId
      for (const message of messagesToInsert) {
        if (message.replyToId) {
          const parentEvent = await db.query.teamsEvent.findFirst({
            where: eq(schema.teamsEvent.eventId, message.replyToId),
          });
          if (parentEvent) {
            await db
              .update(schema.teamsEvent)
              .set({ parentEventId: parentEvent.id })
              .where(eq(schema.teamsEvent.eventId, message.eventId));
          }
        }
      }
    } catch (error) {
      console.error(`Failed to fetch messages for channel ${channel.channelId}:`, error);
    }
  }

  // Update delta link for next sync
  if (newDeltaLink) {
    await db
      .update(schema.teamsIntegration)
      .set({ deltaLink: newDeltaLink })
      .where(eq(schema.teamsIntegration.id, integrationId));
  }

  return eventIds;
}