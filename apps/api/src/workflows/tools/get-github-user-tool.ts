import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

export function getGithubUserTool(db: Db) {
  return tool({
    description: `Get details about a specific GitHub user by their GitHub ID.`,
    parameters: z.object({
      githubId: z.string().describe("The GitHub user ID to get details for"),
    }),
    execute: async (params) => {
      const user = await db
        .select({
          id: schema.githubUser.id,
          githubId: schema.githubUser.githubId,
          login: schema.githubUser.login,
          name: schema.githubUser.name,
          email: schema.githubUser.email,
          avatarUrl: schema.githubUser.avatarUrl,
          htmlUrl: schema.githubUser.htmlUrl,
        })
        .from(schema.githubUser)
        .where(eq(schema.githubUser.githubId, params.githubId))
        .limit(1);
      return user[0] || null;
    },
  });
}
