import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

export function getChangelogJobTool(db: Db) {
  return tool({
    description: "Get details for a changelog generation job by its jobId.",
    parameters: z.object({ jobId: z.string() }),
    execute: async (params) => {
      const job = await db.query.changelogGenerationJob.findFirst({
        where: eq(schema.changelogGenerationJob.id, params.jobId),
        columns: {
          id: true,
          inputUrl: true,
          repoOwner: true,
          repoName: true,
          branch: true,
          fromCommitSha: true,
          toCommitSha: true,
          rangeStart: true,
          rangeEnd: true,
          metadata: true,
          state: true,
          createdAt: true,
          updatedAt: true,
          startedAt: true,
          finishedAt: true,
          changelogId: true,
        },
      });
      return job || null;
    },
  });
}
