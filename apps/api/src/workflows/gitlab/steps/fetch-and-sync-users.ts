import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import * as schema from "../../../db";
import type { Db } from "../../../db/db";
import { isTuple } from "../../../lib/is-tuple";

type FetchAndSyncGitlabUsersParams = {
  accessToken: string;
  instanceUrl: string;
  db: Db;
  integrationId: string;
};

export async function fetchAndSyncGitlabUsers({
  accessToken,
  instanceUrl,
  db,
  integrationId,
}: FetchAndSyncGitlabUsersParams) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  };

  // Get all projects for this integration first
  const projects = await db.query.gitlabProject.findMany({
    where: eq(schema.gitlabProject.integrationId, integrationId),
    columns: { projectId: true },
  });

  const userIds = new Set<string>();

  // Fetch users from all projects
  for (const project of projects) {
    let page = 1;
    const perPage = 100;
    let maxIterations = 10;

    while (maxIterations > 0) {
      const url = `${instanceUrl}/api/v4/projects/${project.projectId}/members/all?per_page=${perPage}&page=${page}`;
      const response = await fetch(url, { headers });

      if (!response.ok) {
        console.warn(
          `Failed to fetch members for project ${project.projectId}: ${response.status}`,
        );
        break;
      }

      const members = await response.json();

      if (!Array.isArray(members) || members.length === 0) {
        break;
      }

      // Collect unique user IDs
      for (const member of members) {
        if (member.id && member.username) {
          userIds.add(member.id.toString());
        }
      }

      // Check if there are more pages
      const totalPages = response.headers.get("X-Total-Pages");
      if (totalPages && page >= parseInt(totalPages)) {
        break;
      }

      page++;
      maxIterations--;
    }
  }

  // Now fetch detailed user information for each unique user
  const batchUpserts = [];

  for (const userId of userIds) {
    try {
      const userResponse = await fetch(`${instanceUrl}/api/v4/users/${userId}`, { headers });

      if (!userResponse.ok) {
        console.warn(`Failed to fetch user ${userId}: ${userResponse.status}`);
        continue;
      }

      const user = (await userResponse.json()) as {
        id: number;
        username: string;
        name?: string;
        email?: string;
        avatar_url?: string;
        web_url: string;
      };

      batchUpserts.push(
        db
          .insert(schema.gitlabUser)
          .values({
            id: nanoid(),
            integrationId,
            gitlabId: user.id.toString(),
            username: user.username,
            name: user.name || null,
            email: user.email || null,
            avatarUrl: user.avatar_url || null,
            webUrl: user.web_url,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: schema.gitlabUser.gitlabId,
            setWhere: eq(schema.gitlabUser.integrationId, integrationId),
            set: {
              username: user.username,
              name: user.name || null,
              email: user.email || null,
              avatarUrl: user.avatar_url || null,
              webUrl: user.web_url,
              updatedAt: new Date(),
            },
          }),
      );
    } catch (error) {
      console.warn(`Error fetching user ${userId}:`, error);
    }
  }

  if (isTuple(batchUpserts)) {
    await db.batch(batchUpserts);
  }
}
