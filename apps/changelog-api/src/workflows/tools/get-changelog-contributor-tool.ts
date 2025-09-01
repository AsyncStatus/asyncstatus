import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

export function getChangelogContributorTool(db: Db) {
  return tool({
    description: `Get contributor details by GitHub login for changelog generation (avatar, urls).`,
    parameters: z.object({ login: z.string() }),
    execute: async ({ login }) => {
      const rows = await db
        .select({
          id: schema.changelogGithubContributor.id,
          login: schema.changelogGithubContributor.login,
          githubUserId: schema.changelogGithubContributor.githubUserId,
          avatarUrl: schema.changelogGithubContributor.avatarUrl,
          htmlUrl: schema.changelogGithubContributor.htmlUrl,
          createdAt: schema.changelogGithubContributor.createdAt,
        })
        .from(schema.changelogGithubContributor)
        .where(eq(schema.changelogGithubContributor.login, login.toLowerCase()))
        .limit(1);
      return rows[0] || null;
    },
  });
}
