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
      .update(schema.linearIntegration)
      .set({
        syncId: null,
        syncUpdatedAt: new Date(),
        syncError: null,
        syncErrorAt: null,
      })
      .where(eq(schema.linearIntegration.id, integrationId));
    try {
      await fn();
      await db
        .update(schema.linearIntegration)
        .set({
          syncId: null,
          syncUpdatedAt: new Date(),
          syncError: null,
          syncErrorAt: null,
        })
        .where(eq(schema.linearIntegration.id, integrationId));
    } catch (error) {
      await db
        .update(schema.linearIntegration)
        .set({
          syncId: null,
          syncUpdatedAt: new Date(),
          syncError: error instanceof Error ? error.message : "Unknown error",
          syncErrorAt: new Date(),
        })
        .where(eq(schema.linearIntegration.id, integrationId));
      throw error;
    }
  };
}
