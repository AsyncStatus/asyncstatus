import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import * as schema from "../../db";
import type { Db } from "../../db/db";

export function getGitlabUserTool(db: Db) {
  return tool({
    description: "Get GitLab user details",
    parameters: z.object({
      gitlabId: z.string(),
    }) as any,
    execute: async ({ gitlabId }) => {
      const user = await db.query.gitlabUser.findFirst({
        where: eq(schema.gitlabUser.gitlabId, gitlabId),
        columns: {
          id: true,
          gitlabId: true,
          username: true,
          name: true,
          email: true,
          avatarUrl: true,
          webUrl: true,
        },
      });

      return user;
    },
  });
}
