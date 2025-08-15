import { generateId } from "better-auth";
import { eq } from "drizzle-orm";
import * as schema from "../../../db";
import type { Db } from "../../../db/db";
import { isTuple } from "../../../lib/is-tuple";

type FetchAndSyncMessagesParams = {
  botToken: string;
  db: Db;
  integrationId: string;
  minEventCreatedAt: Date;
  channelId?: string;
  limit?: number;
  before?: string;
  after?: string;
};

/** Discord epoch (2015-01-01T00:00:00.000Z) used for snowflake timestamp bits */
const DISCORD_EPOCH_MS = 1420070400000n;

function toBigIntMs(date: Date): bigint {
  return BigInt(date.getTime());
}

/**
 * Convert a Date to a minimal Discord snowflake that sorts at the same time.
 * Formula: ((timestampMs - DISCORD_EPOCH) << 22)
 */
function timestampToSnowflake(date: Date): string {
  const ms = toBigIntMs(date);
  const snowflake = (ms - DISCORD_EPOCH_MS) << 22n;
  return snowflake.toString();
}

// Minimal shape of a Discord message we rely on
interface DiscordMessageAuthor {
  id: string;
  username?: string;
  avatar?: string | null;
  discriminator?: string;
  public_flags?: number;
  flags?: number;
  banner?: string | null;
  accent_color?: number | null;
  global_name?: string | null;
  avatar_decoration_data?: unknown;
  collectibles?: unknown;
  display_name_styles?: unknown;
  banner_color?: string | null;
  clan?: unknown;
  primary_guild?: string | null;
}

interface DiscordMessageThreadRef {
  id: string;
}

interface DiscordMessage {
  id: string;
  channel_id: string;
  author?: DiscordMessageAuthor | null;
  timestamp: string; // ISO 8601 timestamp
  thread_id?: string | null;
  thread?: DiscordMessageThreadRef | null;
  type?: number;
  content?: string;
  mentions?: unknown[];
  mention_roles?: unknown[];
  attachments?: unknown[];
  embeds?: unknown[];
  edited_timestamp?: string | null;
  flags?: number;
  components?: unknown[];
  pinned?: boolean;
  mention_everyone?: boolean;
  tts?: boolean;
  // Allow additional fields we do not strictly type
  [key: string]: unknown;
}

// Narrow payload we store to mimic the canonical structure we care about
interface DiscordMessagePayload {
  type: number;
  content: string;
  mentions: unknown[];
  mention_roles: unknown[];
  attachments: unknown[];
  embeds: unknown[];
  timestamp: string;
  edited_timestamp: string | null;
  flags: number;
  components: unknown[];
  id: string;
  channel_id: string;
  author: DiscordMessageAuthor | null;
  pinned: boolean;
  mention_everyone: boolean;
  tts: boolean;
}

export async function fetchAndSyncMessages({
  botToken,
  db,
  integrationId,
  minEventCreatedAt,
  channelId,
  limit = 100,
  before,
  after,
}: FetchAndSyncMessagesParams) {
  // Load servers and channels for the integration
  const servers = await db.query.discordServer.findMany({
    where: eq(schema.discordServer.integrationId, integrationId),
    with: { channels: true },
  });

  if (servers.length === 0) {
    return new Set<string>();
  }

  // Map channelId -> serverId for quick lookup when inserting events
  const channelIdToServerId = new Map<string, string>();
  const allChannelIds: string[] = [];
  for (const server of servers) {
    for (const channel of server.channels) {
      channelIdToServerId.set(channel.channelId, server.id);
      allChannelIds.push(channel.channelId);
    }
  }

  const processedEventIds = new Set<string>();
  const channelsToFetch = channelId ? [channelId] : allChannelIds;

  for (const currentChannelId of channelsToFetch) {
    const url = new URL(`https://discord.com/api/v10/channels/${currentChannelId}/messages`);
    url.searchParams.set("limit", String(limit));

    // If after not provided, derive from cutoff
    const finalAfter = after ?? timestampToSnowflake(minEventCreatedAt);
    if (finalAfter) url.searchParams.set("after", finalAfter);
    if (before) url.searchParams.set("before", before);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        `[DISCORD] Failed to fetch messages for channel ${currentChannelId}: ${response.status} ${response.statusText}`,
      );
      continue;
    }

    const messages = (await response.json()) as DiscordMessage[];
    if (!Array.isArray(messages) || messages.length === 0) {
      continue;
    }

    // Prepare batch upserts
    const eventsToInsert: Array<schema.DiscordEventInsert> = [];
    for (const message of messages) {
      const messageId = String(message.id);
      const createdAtStr: string | undefined = message.timestamp;
      if (!messageId || !createdAtStr) {
        continue;
      }

      const createdAt = new Date(createdAtStr);
      if (!(createdAt instanceof Date) || Number.isNaN(createdAt.getTime())) {
        continue;
      }

      // Defensive filter in case API returns items older than cutoff
      if (createdAt <= minEventCreatedAt) {
        continue;
      }

      const serverId = channelIdToServerId.get(currentChannelId);
      if (!serverId) {
        continue;
      }

      const discordEventId = `message_${messageId}`;
      processedEventIds.add(discordEventId);

      const payload: DiscordMessagePayload = {
        type: typeof message.type === "number" ? message.type : 0,
        content: typeof message.content === "string" ? message.content : "",
        mentions: Array.isArray(message.mentions) ? message.mentions : [],
        mention_roles: Array.isArray(message.mention_roles) ? message.mention_roles : [],
        attachments: Array.isArray(message.attachments) ? message.attachments : [],
        embeds: Array.isArray(message.embeds) ? message.embeds : [],
        timestamp: createdAtStr,
        edited_timestamp:
          typeof message.edited_timestamp === "string" || message.edited_timestamp === null
            ? (message.edited_timestamp as string | null)
            : null,
        flags: typeof message.flags === "number" ? message.flags : 0,
        components: Array.isArray(message.components) ? message.components : [],
        id: messageId,
        channel_id: String(message.channel_id),
        author: message.author
          ? {
              id: String(message.author.id),
              username:
                typeof message.author.username === "string" ? message.author.username : undefined,
              avatar:
                typeof message.author.avatar === "string"
                  ? message.author.avatar
                  : message.author.avatar === null
                    ? null
                    : undefined,
              discriminator:
                typeof message.author.discriminator === "string"
                  ? message.author.discriminator
                  : undefined,
              public_flags:
                typeof message.author.public_flags === "number"
                  ? message.author.public_flags
                  : undefined,
              flags: typeof message.author.flags === "number" ? message.author.flags : undefined,
              banner:
                typeof message.author.banner === "string"
                  ? message.author.banner
                  : message.author.banner === null
                    ? null
                    : undefined,
              accent_color:
                typeof message.author.accent_color === "number"
                  ? message.author.accent_color
                  : message.author.accent_color === null
                    ? null
                    : undefined,
              global_name:
                typeof message.author.global_name === "string"
                  ? message.author.global_name
                  : message.author.global_name === null
                    ? null
                    : undefined,
              avatar_decoration_data: message.author.avatar_decoration_data,
              collectibles: message.author.collectibles,
              display_name_styles: message.author.display_name_styles,
              banner_color:
                typeof message.author.banner_color === "string"
                  ? message.author.banner_color
                  : message.author.banner_color === null
                    ? null
                    : undefined,
              clan: message.author.clan,
              primary_guild:
                typeof message.author.primary_guild === "string"
                  ? message.author.primary_guild
                  : message.author.primary_guild === null
                    ? null
                    : undefined,
            }
          : null,
        pinned: typeof message.pinned === "boolean" ? message.pinned : false,
        mention_everyone:
          typeof message.mention_everyone === "boolean" ? message.mention_everyone : false,
        tts: typeof message.tts === "boolean" ? message.tts : false,
      };

      eventsToInsert.push({
        id: generateId(),
        serverId,
        discordEventId,
        discordUserId: message.author?.id ? String(message.author.id) : null,
        channelId: currentChannelId,
        type: "MESSAGE_CREATE",
        payload,
        messageId,
        threadId: message.thread?.id
          ? String(message.thread.id)
          : message.thread_id
            ? String(message.thread_id)
            : null,
        createdAt,
        insertedAt: new Date(),
      });
    }

    if (eventsToInsert.length > 0) {
      const upserts = eventsToInsert.map((event) =>
        db
          .insert(schema.discordEvent)
          .values(event)
          .onConflictDoUpdate({
            target: schema.discordEvent.discordEventId,
            setWhere: eq(schema.discordEvent.discordEventId, event.discordEventId),
            set: {
              serverId: event.serverId,
              discordUserId: event.discordUserId,
              channelId: event.channelId,
              type: event.type,
              payload: event.payload,
              messageId: event.messageId,
              threadId: event.threadId,
              createdAt: event.createdAt,
              insertedAt: new Date(),
            },
          }),
      );
      if (isTuple(upserts)) {
        await db.batch(upserts);
      }
    }
  }

  return processedEventIds;
}
