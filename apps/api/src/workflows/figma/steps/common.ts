import type { Db } from "../../../db/db";
import { eq } from "drizzle-orm";
import * as schema from "../../../db";

export function createReportStatusFn({
  db,
  integrationId,
}: {
  db: Db;
  integrationId: string;
}) {
  return async <T>(fn: () => Promise<T>): Promise<T> => {
    try {
      await db
        .update(schema.figmaIntegration)
        .set({
          syncUpdatedAt: new Date(),
        })
        .where(eq(schema.figmaIntegration.id, integrationId));

      const result = await fn();

      await db
        .update(schema.figmaIntegration)
        .set({
          syncUpdatedAt: new Date(),
          syncError: null,
          syncErrorAt: null,
        })
        .where(eq(schema.figmaIntegration.id, integrationId));

      return result;
    } catch (error) {
      await db
        .update(schema.figmaIntegration)
        .set({
          syncError: error instanceof Error ? error.message : String(error),
          syncErrorAt: new Date(),
        })
        .where(eq(schema.figmaIntegration.id, integrationId));
      throw error;
    }
  };
}