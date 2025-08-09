import { eq } from "drizzle-orm";
import * as schema from "../../../db";
import type { Db } from "../../../db/db";

type WithSafeSyncStatusParams = {
  db: Db;
  integrationId: string;
};

export function createReportStatusFn({ db, integrationId }: WithSafeSyncStatusParams) {
  return async (fn: () => Promise<void>) => {
    await db
      .update(schema.githubIntegration)
      .set({
        syncId: null,
        syncUpdatedAt: new Date(),
        syncError: null,
        syncErrorAt: null,
      })
      .where(eq(schema.githubIntegration.id, integrationId));
    try {
      await fn();
      await db
        .update(schema.githubIntegration)
        .set({
          syncId: null,
          syncUpdatedAt: new Date(),
          syncError: null,
          syncErrorAt: null,
        })
        .where(eq(schema.githubIntegration.id, integrationId));
    } catch (error) {
      await db
        .update(schema.githubIntegration)
        .set({
          syncId: null,
          syncUpdatedAt: new Date(),
          syncError: error instanceof Error ? error.message : "Unknown error",
          syncErrorAt: new Date(),
        })
        .where(eq(schema.githubIntegration.id, integrationId));
      throw error;
    }
  };
}
