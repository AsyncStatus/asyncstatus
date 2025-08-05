import { generateId } from "better-auth";
import { eq } from "drizzle-orm";
import * as schema from "../../../db";
import type { Db } from "../../../db/db";

type FetchAndSyncChannelsParams = {
  botToken: string;
  db: Db;
  integrationId: string;
  servers: schema.DiscordServer[];
};

interface DiscordChannel {
  id: string;
  type: number;
  guild_id?: string;
  position?: number;
  name?: string;
  topic?: string | null;
  nsfw?: boolean;
  parent_id?: string | null;
}

export async function fetchAndSyncChannels({ botToken, db, servers }: FetchAndSyncChannelsParams) {
  console.log(`[DISCORD] Starting sync for ${servers.length} servers`);

  for (const server of servers) {
    try {
      // Fetch channels for this guild
      const response = await fetch(
        `https://discord.com/api/v10/guilds/${server.guildId}/channels`,
        {
          headers: {
            Authorization: `Bot ${botToken}`,
          },
        },
      );

      if (!response.ok) {
        console.error(
          `[DISCORD] Failed to fetch channels for guild ${server.guildId}: ${response.statusText}`,
        );
        continue;
      }

      const channels = (await response.json()) as DiscordChannel[];
      console.log(`[DISCORD] Found ${channels.length} channels for guild ${server.guildId}`);

      // Update server sync status
      await db
        .update(schema.discordServer)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(schema.discordServer.id, server.id));

      // Sync channels
      for (const channel of channels) {
        // Only sync text and voice channels (types 0, 2)
        if (channel.type !== 0 && channel.type !== 2) {
          continue;
        }

        const existingChannel = await db.query.discordChannel.findFirst({
          where: eq(schema.discordChannel.channelId, channel.id),
        });

        const channelData: schema.DiscordChannelInsert = {
          id: existingChannel?.id || generateId(),
          serverId: server.id,
          channelId: channel.id,
          guildId: channel.guild_id || server.guildId,
          name: channel.name || "Unknown",
          type: channel.type,
          position: channel.position,
          parentId: channel.parent_id,
          topic: channel.topic,
          nsfw: channel.nsfw || false,
          isPrivate: false, // Discord API doesn't directly indicate this
          isArchived: false, // Would need additional API calls to determine
          createdAt: existingChannel?.createdAt || new Date(),
          updatedAt: new Date(),
        };

        if (existingChannel) {
          await db
            .update(schema.discordChannel)
            .set({
              ...channelData,
              id: existingChannel.id,
              createdAt: existingChannel.createdAt,
            })
            .where(eq(schema.discordChannel.id, existingChannel.id));
        } else {
          await db.insert(schema.discordChannel).values(channelData);
        }
      }

      // Delete channels that no longer exist
      const channelIds = channels.map((c) => c.id);
      const existingChannels = await db.query.discordChannel.findMany({
        where: eq(schema.discordChannel.serverId, server.id),
      });

      for (const existingChannel of existingChannels) {
        if (!channelIds.includes(existingChannel.channelId)) {
          await db
            .delete(schema.discordChannel)
            .where(eq(schema.discordChannel.id, existingChannel.id));
        }
      }
    } catch (error) {
      console.error(`[DISCORD] Error syncing channels for server ${server.guildId}:`, error);
    }
  }

  console.log(`[DISCORD] Channel sync completed`);
}
