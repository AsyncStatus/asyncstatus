import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { eq } from "drizzle-orm";

type WithSafeSyncStatusParams = {
  db: Db;
  integrationId: string;
};

export function createReportStatusFn({ db, integrationId }: WithSafeSyncStatusParams) {
  return async (fn: () => Promise<void>) => {
    await db
      .update(schema.slackIntegration)
      .set({
        syncError: null,
        syncErrorAt: null,
        syncUpdatedAt: new Date(),
      })
      .where(eq(schema.slackIntegration.id, integrationId));
    try {
      await fn();
      await db
        .update(schema.slackIntegration)
        .set({
          syncUpdatedAt: new Date(),
          syncError: null,
          syncErrorAt: null,
        })
        .where(eq(schema.slackIntegration.id, integrationId));
    } catch (error) {
      await db
        .update(schema.slackIntegration)
        .set({
          syncError: error instanceof Error ? error.message : "Unknown error",
          syncErrorAt: new Date(),
        })
        .where(eq(schema.slackIntegration.id, integrationId));
      throw error;
    }
  };
}
