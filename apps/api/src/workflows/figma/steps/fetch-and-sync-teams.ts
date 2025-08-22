import { generateId } from "better-auth";
import { eq } from "drizzle-orm";
import type { Db } from "../../../db/db";
import * as schema from "../../../db";

interface FigmaTeamResponse {
  id: string;
  name: string;
  description?: string;
  plan?: string;
}

export async function fetchAndSyncTeams({
  accessToken,
  db,
  integrationId,
}: {
  accessToken: string;
  db: Db;
  integrationId: string;
}) {
  const integration = await db.query.figmaIntegration.findFirst({
    where: eq(schema.figmaIntegration.id, integrationId),
  });

  if (!integration) {
    throw new Error("Integration not found");
  }

  // Fetch team information from Figma API
  const response = await fetch(`https://api.figma.com/v1/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Figma teams: ${response.statusText}`);
  }

  const data = await response.json() as {
    teams?: FigmaTeamResponse[];
  };
  const teams: FigmaTeamResponse[] = data.teams || [];

  // Sync teams to database
  const teamInserts: schema.FigmaTeamInsert[] = [];

  for (const team of teams) {
    if (team.id === integration.teamId) {
      teamInserts.push({
        id: generateId(),
        integrationId,
        teamId: team.id,
        name: team.name,
        description: team.description || null,
        plan: team.plan || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  if (teamInserts.length > 0) {
    await db
      .insert(schema.figmaTeam)
      .values(teamInserts)
      .onConflictDoUpdate({
        target: schema.figmaTeam.teamId,
        set: {
          name: teamInserts[0]!.name,
          description: teamInserts[0]!.description,
          plan: teamInserts[0]!.plan,
          updatedAt: new Date(),
        },
      });
  }

  return { teamCount: teamInserts.length };
}