import { generateId } from "better-auth";
import { eq } from "drizzle-orm";
import type { Db } from "../../../db/db";
import * as schema from "../../../db";

interface FigmaProjectResponse {
  id: string;
  name: string;
}

export async function fetchAndSyncProjects({
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
    with: { teams: true },
  });

  if (!integration || !integration.teams.length) {
    throw new Error("Integration or teams not found");
  }

  const allProjects: schema.FigmaProjectInsert[] = [];

  for (const team of integration.teams) {
    // Fetch projects for each team
    const response = await fetch(`https://api.figma.com/v1/teams/${team.teamId}/projects`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch projects for team ${team.teamId}: ${response.statusText}`);
      continue;
    }

    const data = await response.json() as {
      projects?: FigmaProjectResponse[];
    };
    const projects: FigmaProjectResponse[] = data.projects || [];

    for (const project of projects) {
      allProjects.push({
        id: generateId(),
        teamId: team.id,
        projectId: project.id,
        name: project.name,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  if (allProjects.length > 0) {
    // Batch insert projects with conflict resolution
    for (const project of allProjects) {
      await db
        .insert(schema.figmaProject)
        .values(project)
        .onConflictDoUpdate({
          target: schema.figmaProject.projectId,
          set: {
            name: project.name,
            updatedAt: new Date(),
          },
        });
    }
  }

  return { projectCount: allProjects.length };
}