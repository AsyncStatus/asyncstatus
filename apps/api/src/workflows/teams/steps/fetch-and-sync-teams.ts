import { generateId } from "better-auth";
import { eq } from "drizzle-orm";
import * as schema from "../../../db";
import type { Db } from "../../../db/db";
import { isTuple } from "../../../lib/is-tuple";
import { fetchAllPages, makeGraphApiRequest } from "./common";

type FetchAndSyncTeamsAndChannelsParams = {
  db: Db;
  integrationId: string;
  graphAccessToken: string;
  tenantId: string;
};

interface Team {
  id: string;
  displayName: string;
  description?: string;
  webUrl?: string;
  isArchived?: boolean;
  createdDateTime?: string;
}

interface Channel {
  id: string;
  displayName: string;
  description?: string;
  email?: string;
  webUrl?: string;
  membershipType?: string;
  isFavoriteByDefault?: boolean;
  createdDateTime?: string;
}

export async function fetchAndSyncTeamsAndChannels({
  db,
  integrationId,
  graphAccessToken,
  tenantId,
}: FetchAndSyncTeamsAndChannelsParams) {
  // Fetch all teams in the tenant
  const teams: Team[] = [];
  for await (const page of fetchAllPages<Team>("/teams", graphAccessToken)) {
    teams.push(...page);
  }

  // Process each team and its channels
  for (const team of teams) {
    // Fetch channels for this team
    const channels: Channel[] = [];
    try {
      for await (const page of fetchAllPages<Channel>(
        `/teams/${team.id}/channels`,
        graphAccessToken
      )) {
        channels.push(...page);
      }
    } catch (error) {
      console.error(`Failed to fetch channels for team ${team.id}:`, error);
      continue;
    }

    // Update the integration with the first team found (if not already set)
    const integration = await db.query.teamsIntegration.findFirst({
      where: eq(schema.teamsIntegration.id, integrationId),
    });

    if (integration && !integration.teamId && teams.length > 0) {
      await db
        .update(schema.teamsIntegration)
        .set({
          teamId: teams[0].id,
          teamName: teams[0].displayName,
        })
        .where(eq(schema.teamsIntegration.id, integrationId));
    }

    // Prepare channels for bulk insert
    const channelsToInsert: schema.TeamsChannelInsert[] = channels.map((channel) => ({
      id: generateId(),
      integrationId,
      channelId: channel.id,
      teamId: team.id,
      displayName: channel.displayName,
      description: channel.description ?? null,
      email: channel.email ?? null,
      webUrl: channel.webUrl ?? null,
      membershipType: channel.membershipType ?? null,
      isArchived: team.isArchived ?? false,
      isFavoriteByDefault: channel.isFavoriteByDefault ?? false,
      createdDateTime: channel.createdDateTime ? new Date(channel.createdDateTime) : null,
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Batch upsert channels
    const batchUpserts = channelsToInsert.map((channel) => {
      return db
        .insert(schema.teamsChannel)
        .values(channel)
        .onConflictDoUpdate({
          target: schema.teamsChannel.channelId,
          setWhere: eq(schema.teamsChannel.channelId, channel.channelId),
          set: {
            displayName: channel.displayName,
            description: channel.description,
            email: channel.email,
            webUrl: channel.webUrl,
            membershipType: channel.membershipType,
            isArchived: channel.isArchived,
            isFavoriteByDefault: channel.isFavoriteByDefault,
            updatedAt: new Date(),
          },
        });
    });

    if (isTuple(batchUpserts)) {
      await db.batch(batchUpserts);
    }
  }
}