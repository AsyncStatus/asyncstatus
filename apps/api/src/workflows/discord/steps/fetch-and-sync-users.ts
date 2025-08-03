import { generateId } from "better-auth";
import { eq } from "drizzle-orm";
import * as schema from "../../../db";
import type { Db } from "../../../db/db";

type FetchAndSyncUsersParams = {
  botToken: string;
  db: Db;
  integrationId: string;
  servers: schema.DiscordServer[];
};

interface DiscordMember {
  user?: {
    id: string;
    username: string;
    discriminator: string;
    global_name?: string | null;
    avatar?: string | null;
    bot?: boolean;
    system?: boolean;
    mfa_enabled?: boolean;
    locale?: string;
    verified?: boolean;
    email?: string | null;
    flags?: number;
    premium_type?: number;
  };
  nick?: string | null;
  roles: string[];
  joined_at: string;
  premium_since?: string | null;
  deaf: boolean;
  mute: boolean;
}

export async function fetchAndSyncUsers({
  botToken,
  db,
  integrationId,
  servers,
}: FetchAndSyncUsersParams) {
  console.log(`[DISCORD] Starting user sync for ${servers.length} servers`);

  const processedUserIds = new Set<string>();

  for (const server of servers) {
    try {
      let after: string | undefined;
      let hasMore = true;

      while (hasMore) {
        // Fetch members for this guild (paginated, max 1000 per request)
        const url = new URL(`https://discord.com/api/v10/guilds/${server.guildId}/members`);
        url.searchParams.set("limit", "1000");
        if (after) {
          url.searchParams.set("after", after);
        }

        const response = await fetch(url.toString(), {
          headers: {
            Authorization: `Bot ${botToken}`,
          },
        });

        if (!response.ok) {
          console.error(
            `[DISCORD] Failed to fetch members for guild ${server.guildId}: ${response.statusText}`,
          );
          break;
        }

        const members = (await response.json()) as DiscordMember[];
        console.log(`[DISCORD] Found ${members.length} members for guild ${server.guildId}`);

        if (members.length === 0) {
          hasMore = false;
          break;
        }

        // Update the after cursor for pagination
        if (members.length === 1000) {
          const lastMember = members[members.length - 1];
          after = lastMember?.user?.id;
        } else {
          hasMore = false;
        }

        // Sync users
        for (const member of members) {
          if (!member.user || processedUserIds.has(member.user.id)) {
            continue;
          }

          processedUserIds.add(member.user.id);

          const existingUser = await db.query.discordUser.findFirst({
            where: eq(schema.discordUser.discordUserId, member.user.id),
          });

          const userData: schema.DiscordUserInsert = {
            id: existingUser?.id || generateId(),
            integrationId,
            discordUserId: member.user.id,
            username: member.user.username,
            discriminator: member.user.discriminator,
            globalName: member.user.global_name || null,
            email: member.user.email || null,
            avatarHash: member.user.avatar || null,
            isBot: member.user.bot || false,
            isSystem: member.user.system || false,
            locale: member.user.locale || null,
            verified: member.user.verified || false,
            mfaEnabled: member.user.mfa_enabled || false,
            premiumType: member.user.premium_type || null,
            accessToken: null, // Only available through OAuth2
            scopes: null,
            tokenExpiresAt: null,
            refreshToken: null,
            isInstaller: false,
            createdAt: existingUser?.createdAt || new Date(),
            updatedAt: new Date(),
          };

          if (existingUser) {
            await db
              .update(schema.discordUser)
              .set({
                ...userData,
                id: existingUser.id,
                createdAt: existingUser.createdAt,
                // Preserve OAuth tokens if they exist
                accessToken: existingUser.accessToken,
                scopes: existingUser.scopes,
                tokenExpiresAt: existingUser.tokenExpiresAt,
                refreshToken: existingUser.refreshToken,
                isInstaller: existingUser.isInstaller,
              })
              .where(eq(schema.discordUser.id, existingUser.id));
          } else {
            await db.insert(schema.discordUser).values(userData);
          }
        }
      }
    } catch (error) {
      console.error(`[DISCORD] Error syncing users for server ${server.guildId}:`, error);
    }
  }

  console.log(`[DISCORD] User sync completed. Processed ${processedUserIds.size} unique users`);
}
