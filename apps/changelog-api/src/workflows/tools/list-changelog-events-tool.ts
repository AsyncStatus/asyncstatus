import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { tool } from "ai";
import { and, asc, between, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { z } from "zod";

export function listChangelogEventsTool(db: Db) {
  return tool({
    description:
      "List changelog GitHub events for a repo, optionally constrained by date or commit ranges.",
    parameters: z.object({
      owner: z.string(),
      repo: z.string(),
      fromCommitSha: z.string().optional(),
      toCommitSha: z.string().optional(),
      rangeStart: z.string().optional(),
      rangeEnd: z.string().optional(),
      sourceTypes: z
        .array(z.enum(["commit", "pull_request", "issue", "release", "tag"]))
        .optional()
        .default(["commit", "pull_request", "issue", "release", "tag"]),
      order: z.enum(["asc", "desc"]).optional().default("desc"),
      limit: z.number().optional().default(500),
    }),
    execute: async (params) => {
      const conditions = [
        eq(schema.changelogGithubEvent.repoOwner, params.owner),
        eq(schema.changelogGithubEvent.repoName, params.repo),
      ];

      if (params.rangeStart && params.rangeEnd) {
        conditions.push(
          between(
            schema.changelogGithubEvent.eventTimestampMs,
            new Date(params.rangeStart),
            new Date(params.rangeEnd),
          ),
        );
      } else {
        if (params.rangeStart) {
          conditions.push(
            gte(schema.changelogGithubEvent.eventTimestampMs, new Date(params.rangeStart)),
          );
        }
        if (params.rangeEnd) {
          conditions.push(
            lte(schema.changelogGithubEvent.eventTimestampMs, new Date(params.rangeEnd)),
          );
        }
      }

      if (params.sourceTypes && params.sourceTypes.length > 0) {
        conditions.push(inArray(schema.changelogGithubEvent.sourceType, params.sourceTypes));
      }

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
        .where(and(...conditions))
        .orderBy(
          params.order === "asc"
            ? asc(schema.changelogGithubEvent.eventTimestampMs)
            : desc(schema.changelogGithubEvent.eventTimestampMs),
        )
        .limit(params.limit);

      return rows;
    },
  });
}
