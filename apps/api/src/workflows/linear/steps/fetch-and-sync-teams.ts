import type { LinearClient } from "@linear/sdk";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import * as schema from "../../../db";
import type { Db } from "../../../db/db";
import { isTuple } from "../../../lib/is-tuple";

type FetchAndSyncTeamsParams = {
  linearClient: LinearClient;
  db: Db;
  integrationId: string;
};

export async function fetchAndSyncTeams({
  linearClient,
  db,
  integrationId,
}: FetchAndSyncTeamsParams) {
  const teams = await linearClient.teams();

  if (teams.nodes.length === 0) {
    return;
  }

  const batchUpserts = teams.nodes.map((team) => {
    return db
      .insert(schema.linearTeam)
      .values({
        id: nanoid(),
        integrationId,
        teamId: team.id,
        name: team.name,
        key: team.key,
        description: team.description ?? null,
        private: team.private ?? false,
        icon: team.icon ?? null,
        color: team.color ?? null,
        timezone: team.timezone ?? null,
        issueCount: team.issueCount ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.linearTeam.teamId,
        setWhere: eq(schema.linearTeam.integrationId, integrationId),
        set: {
          name: team.name,
          key: team.key,
          description: team.description ?? null,
          private: team.private ?? false,
          icon: team.icon ?? null,
          color: team.color ?? null,
          timezone: team.timezone ?? null,
          issueCount: team.issueCount ?? null,
          updatedAt: new Date(),
        },
      });
  });

  if (isTuple(batchUpserts)) {
    await db.batch(batchUpserts);
  }
}