import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { eq } from "drizzle-orm";

type CreateReportStatusFnParams = {
  db: Db;
  jobId: string;
  status: string;
  statusOnError: string;
  canSkip?: boolean;
};

export function createReportStatusFn({
  db,
  jobId,
  status,
  statusOnError,
  canSkip = false,
}: CreateReportStatusFnParams) {
  return async (fn: () => Promise<void>) => {
    await db
      .update(schema.changelogGenerationJob)
      .set({
        updatedAt: new Date(),
        errorMessage: null,
        errorAt: null,
        metadata: { humanReadableStatus: status },
      })
      .where(eq(schema.changelogGenerationJob.id, jobId));
    try {
      await fn();
      await db
        .update(schema.changelogGenerationJob)
        .set({ updatedAt: new Date() })
        .where(eq(schema.changelogGenerationJob.id, jobId));
    } catch (error) {
      console.error(error);
      await db
        .update(schema.changelogGenerationJob)
        .set({
          updatedAt: new Date(),
          state: "error",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          errorAt: new Date(),
          metadata: { humanReadableStatus: statusOnError },
        })
        .where(eq(schema.changelogGenerationJob.id, jobId));
      if (canSkip) {
        return;
      }
      throw error;
    }
  };
}
