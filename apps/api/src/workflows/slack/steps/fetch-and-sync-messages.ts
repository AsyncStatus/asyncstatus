import type { WebClient } from "@slack/web-api";
import type { ConversationsHistoryResponse } from "@slack/web-api/dist/types/response/ConversationsHistoryResponse";
import { generateId } from "better-auth";
import { eq } from "drizzle-orm";
import * as schema from "../../../db";
import type { Db } from "../../../db/db";
import { isTuple } from "../../../lib/is-tuple";

type FetchAndSyncMessagesParams = {
  slackClient: WebClient;
  db: Db;
  integrationId: string;
  minEventCreatedAt: Date;
};

type SlackMessageEventPayload = {
  type: "message";
  channel: string;
  user?: string;
  text?: string;
  ts: string;
  event_ts: string;
  thread_ts?: string;
  client_msg_id?: string;
  blocks?: unknown;
  team?: string;
  subtype?: string;
  attachments?: unknown;
  files?: unknown;
  [key: string]: unknown;
};

export async function fetchAndSyncMessages({
  slackClient,
  db,
  integrationId,
  minEventCreatedAt,
}: FetchAndSyncMessagesParams) {
  const integration = await db.query.slackIntegration.findFirst({
    where: eq(schema.slackIntegration.id, integrationId),
  });
  if (!integration) {
    throw new Error("Integration not found");
  }

  const channels = await db.query.slackChannel.findMany({
    where: eq(schema.slackChannel.integrationId, integrationId),
    columns: { channelId: true },
  });

  const processedEventIds = new Set<string>();

  const oldestTs = (minEventCreatedAt.getTime() / 1000).toString();

  for (const channel of channels) {
    const iterator = slackClient.paginate("conversations.history", {
      channel: channel.channelId,
      limit: 1000,
      oldest: oldestTs,
    }) as unknown as AsyncIterable<ConversationsHistoryResponse>;

    for await (const page of iterator) {
      if (!page.ok) {
        throw new Error(page.error ?? "Unknown Slack API error");
      }

      const messagesToInsert: Array<schema.SlackEventInsert> = [];

      const messages = (page.messages ?? []) as NonNullable<
        ConversationsHistoryResponse["messages"]
      >;
      for (const message of messages) {
        if (!message || !message.ts) {
          continue;
        }

        const createdAt = new Date(Math.floor(parseFloat(message.ts) * 1000));
        // Skip messages older than cutoff (defensive, since we pass oldest)
        if (createdAt <= minEventCreatedAt) {
          continue;
        }

        const slackEventId = `slack:${integration.teamId}:${channel.channelId}:${message.ts}`;
        processedEventIds.add(slackEventId);

        const payload: SlackMessageEventPayload = {
          type: "message",
          channel: channel.channelId,
          user: typeof message.user === "string" ? message.user : undefined,
          text:
            typeof (message as Record<string, unknown>).text === "string"
              ? ((message as Record<string, unknown>).text as string)
              : undefined,
          client_msg_id:
            typeof (message as Record<string, unknown>).client_msg_id === "string"
              ? ((message as Record<string, unknown>).client_msg_id as string)
              : undefined,
          blocks: (message as Record<string, unknown>).blocks,
          team:
            typeof (message as Record<string, unknown>).team === "string"
              ? ((message as Record<string, unknown>).team as string)
              : integration.teamId,
          ts: message.ts,
          event_ts: message.ts,
          thread_ts: typeof message.thread_ts === "string" ? message.thread_ts : undefined,
          subtype:
            typeof (message as Record<string, unknown>).subtype === "string"
              ? ((message as Record<string, unknown>).subtype as string)
              : undefined,
          attachments: (message as Record<string, unknown>).attachments,
          files: (message as Record<string, unknown>).files,
        };

        messagesToInsert.push({
          id: generateId(),
          slackTeamId: integration.teamId,
          slackEventId,
          type: "message",
          channelId: channel.channelId,
          slackUserId: typeof message.user === "string" ? message.user : null,
          messageTs: message.ts,
          threadTs: typeof message.thread_ts === "string" ? message.thread_ts : null,
          payload,
          createdAt,
          insertedAt: new Date(),
        });
      }

      const batchUpserts = messagesToInsert.map((event) =>
        db
          .insert(schema.slackEvent)
          .values(event)
          .onConflictDoUpdate({
            target: schema.slackEvent.slackEventId,
            setWhere: eq(schema.slackEvent.slackEventId, event.slackEventId),
            set: {
              type: event.type,
              channelId: event.channelId,
              slackUserId: event.slackUserId,
              messageTs: event.messageTs,
              threadTs: event.threadTs,
              payload: event.payload,
              createdAt: event.createdAt,
              insertedAt: new Date(),
            },
          }),
      );

      if (isTuple(batchUpserts)) {
        await db.batch(batchUpserts);
      }
    }
  }

  return processedEventIds;
}
