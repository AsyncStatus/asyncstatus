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
      .update(schema.teamsIntegration)
      .set({
        syncError: null,
        syncErrorAt: null,
        syncUpdatedAt: new Date(),
      })
      .where(eq(schema.teamsIntegration.id, integrationId));
    try {
      await fn();
      await db
        .update(schema.teamsIntegration)
        .set({
          syncUpdatedAt: new Date(),
          syncError: null,
          syncErrorAt: null,
        })
        .where(eq(schema.teamsIntegration.id, integrationId));
    } catch (error) {
      await db
        .update(schema.teamsIntegration)
        .set({
          syncError: error instanceof Error ? error.message : "Unknown error",
          syncErrorAt: new Date(),
        })
        .where(eq(schema.teamsIntegration.id, integrationId));
      throw error;
    }
  };
}

export interface GraphApiError {
  error: {
    code: string;
    message: string;
    innerError?: {
      code: string;
      date: string;
      "request-id": string;
      "client-request-id": string;
    };
  };
}

export async function makeGraphApiRequest<T>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = (await response.json()) as GraphApiError;
    throw new Error(`Graph API error: ${error.error.message} (${error.error.code})`);
  }

  return response.json() as Promise<T>;
}

export interface GraphApiPagedResponse<T> {
  value: T[];
  "@odata.nextLink"?: string;
  "@odata.deltaLink"?: string;
}

export async function* fetchAllPages<T>(
  endpoint: string,
  accessToken: string
): AsyncGenerator<T[], void, unknown> {
  let nextLink: string | undefined = endpoint;

  while (nextLink) {
    const isFullUrl = nextLink.startsWith("https://");
    const url = isFullUrl ? nextLink : `https://graph.microsoft.com/v1.0${nextLink}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = (await response.json()) as GraphApiError;
      throw new Error(`Graph API error: ${error.error.message} (${error.error.code})`);
    }

    const data = (await response.json()) as GraphApiPagedResponse<T>;
    yield data.value;

    nextLink = data["@odata.nextLink"];
  }
}