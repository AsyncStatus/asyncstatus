import { generateId } from "better-auth";
import { eq } from "drizzle-orm";
import type { Db } from "../../../db/db";
import * as schema from "../../../db";

interface FigmaUserResponse {
  id: string;
  handle: string;
  img_url?: string;
  email?: string;
  name?: string;
}

export async function fetchAndSyncUsers({
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
    with: {
      teams: {
        with: {
          projects: {
            with: {
              files: true,
            },
          },
        },
      },
    },
  });

  if (!integration || !integration.teams.length) {
    throw new Error("Integration or teams not found");
  }

  const userMap = new Map<string, FigmaUserResponse>();

  // First, get team members
  for (const team of integration.teams) {
    try {
      const response = await fetch(`https://api.figma.com/v1/teams/${team.teamId}/members`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json() as {
          members?: Array<{
            user?: FigmaUserResponse;
          }>;
        };
        const members = data.members || [];
        
        for (const member of members) {
          if (member.user && !userMap.has(member.user.id)) {
            userMap.set(member.user.id, {
              id: member.user.id,
              handle: member.user.handle || member.user.email || "unknown",
              img_url: member.user.img_url,
              email: member.user.email,
              name: member.user.name,
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching team members for ${team.teamId}:`, error);
    }
  }

  // Additionally, try to get users from file comments (if we have file keys)
  const fileKeys = new Set<string>();
  for (const team of integration.teams) {
    for (const project of team.projects) {
      for (const file of project.files) {
        fileKeys.add(file.fileKey);
      }
    }
  }

  // For each file, try to get recent comments to discover more users
  for (const fileKey of Array.from(fileKeys).slice(0, 10)) { // Limit to first 10 files to avoid rate limits
    try {
      const response = await fetch(`https://api.figma.com/v1/files/${fileKey}/comments`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json() as {
          comments?: Array<{
            user?: FigmaUserResponse;
          }>;
        };
        const comments = data.comments || [];
        
        for (const comment of comments) {
          if (comment.user && !userMap.has(comment.user.id)) {
            userMap.set(comment.user.id, {
              id: comment.user.id,
              handle: comment.user.handle || comment.user.email || "unknown",
              img_url: comment.user.img_url,
              email: comment.user.email,
              name: comment.user.name,
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching comments for file ${fileKey}:`, error);
    }
  }

  // Sync users to database
  const userInserts: schema.FigmaUserInsert[] = [];

  for (const user of userMap.values()) {
    userInserts.push({
      id: generateId(),
      integrationId,
      figmaId: user.id,
      email: user.email || undefined,
      handle: user.handle,
      imgUrl: user.img_url || null,
      name: user.name || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  if (userInserts.length > 0) {
    // Batch insert users with conflict resolution
    for (const user of userInserts) {
      await db
        .insert(schema.figmaUser)
        .values(user)
        .onConflictDoUpdate({
          target: schema.figmaUser.figmaId,
          set: {
            email: user.email,
            handle: user.handle,
            imgUrl: user.imgUrl,
            name: user.name,
            updatedAt: new Date(),
          },
        });
    }
  }

  return { userCount: userInserts.length };
}