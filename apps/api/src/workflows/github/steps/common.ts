import { eq } from "drizzle-orm";
import * as schema from "../../../db";
import type { Db } from "../../../db/db";
import {
  type SyncGithubWorkflowStatusName,
  SyncGithubWorkflowStatusStep,
} from "../../../schema/github-integration";

type WithSafeSyncStatusParams = {
  db: Db;
  integrationId: string;
};

export function createReportStatusFn({ db, integrationId }: WithSafeSyncStatusParams) {
  return async (
    syncStatusName: (typeof SyncGithubWorkflowStatusName)[keyof typeof SyncGithubWorkflowStatusName],
    fn: () => Promise<void>,
  ) => {
    await db
      .update(schema.githubIntegration)
      .set({
        syncStatusName,
        syncStatusStep: SyncGithubWorkflowStatusStep.pending,
        syncStatusUpdatedAt: new Date(),
        syncError: null,
        syncErrorAt: null,
      })
      .where(eq(schema.githubIntegration.id, integrationId));
    try {
      await fn();
      await db
        .update(schema.githubIntegration)
        .set({
          syncStatusName,
          syncStatusStep: SyncGithubWorkflowStatusStep.success,
          syncStatusUpdatedAt: new Date(),
          syncError: null,
          syncErrorAt: null,
        })
        .where(eq(schema.githubIntegration.id, integrationId));
    } catch (error) {
      await db
        .update(schema.githubIntegration)
        .set({
          syncError: error instanceof Error ? error.message : "Unknown error",
          syncErrorAt: new Date(),
        })
        .where(eq(schema.githubIntegration.id, integrationId));
      throw error;
    }
  };
}
