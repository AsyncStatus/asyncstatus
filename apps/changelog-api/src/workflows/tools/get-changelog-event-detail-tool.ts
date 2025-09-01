import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

export function getChangelogEventDetailTool(db: Db) {
  return tool({
    description: `Get detailed information about a specific changelog GitHub event by its ID, including payload and typed fields.`,
    parameters: z.object({
      eventId: z.string().describe("The changelog_github_event ID"),
    }),
    execute: async (params) => {
      const rows = await db
        .select({
          id: schema.changelogGithubEvent.id,
          repoOwner: schema.changelogGithubEvent.repoOwner,
          repoName: schema.changelogGithubEvent.repoName,
          sourceType: schema.changelogGithubEvent.sourceType,
          externalId: schema.changelogGithubEvent.externalId,
          sourceUrl: schema.changelogGithubEvent.sourceUrl,
          commitSha: schema.changelogGithubEvent.commitSha,
          prNumber: schema.changelogGithubEvent.prNumber,
          issueNumber: schema.changelogGithubEvent.issueNumber,
          releaseTag: schema.changelogGithubEvent.releaseTag,
          payload: schema.changelogGithubEvent.payload,
          eventTimestampMs: schema.changelogGithubEvent.eventTimestampMs,
          insertedAt: schema.changelogGithubEvent.insertedAt,
          lastSeenAt: schema.changelogGithubEvent.lastSeenAt,
        })
        .from(schema.changelogGithubEvent)
        .where(eq(schema.changelogGithubEvent.id, params.eventId))
        .limit(1);
      return rows[0] || null;
    },
  });
}
