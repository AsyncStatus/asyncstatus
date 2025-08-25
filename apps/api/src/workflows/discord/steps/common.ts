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
      .update(schema.discordIntegration)
      .set({
        syncUpdatedAt: new Date(),
        syncError: null,
        syncErrorAt: null,
      })
      .where(eq(schema.discordIntegration.id, integrationId));
    try {
      await fn();
      await db
        .update(schema.discordIntegration)
        .set({
          syncUpdatedAt: new Date(),
          syncError: null,
          syncErrorAt: null,
        })
        .where(eq(schema.discordIntegration.id, integrationId));
    } catch (error) {
      await db
        .update(schema.discordIntegration)
        .set({
          syncError: error instanceof Error ? error.message : "Unknown error",
          syncErrorAt: new Date(),
        })
        .where(eq(schema.discordIntegration.id, integrationId));
      throw error;
    }
  };
}
