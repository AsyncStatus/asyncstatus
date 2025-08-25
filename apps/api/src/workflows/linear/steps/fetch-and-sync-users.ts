import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import type { LinearClient } from "@linear/sdk";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { isTuple } from "../../../lib/is-tuple";

type FetchAndSyncUsersParams = {
  linearClient: LinearClient;
  db: Db;
  integrationId: string;
};

export async function fetchAndSyncUsers({
  linearClient,
  db,
  integrationId,
}: FetchAndSyncUsersParams) {
  const users = await linearClient.users({ includeArchived: false, first: 200 });
  let maxIterations = 10;

  if (users.nodes.length === 0) {
    return;
  }

  let processed = 0;
  while (maxIterations > 0) {
    const current = users.nodes.slice(processed);
    processed = users.nodes.length;

    const batchUpserts = current.map((user) => {
      return db
        .insert(schema.linearUser)
        .values({
          id: nanoid(),
          integrationId,
          userId: user.id,
          email: user.email ?? null,
          name: user.name ?? null,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl ?? null,
          admin: user.admin ?? false,
          active: user.active ?? true,
          guest: user.guest ?? false,
          archivedAt: user.archivedAt ? new Date(user.archivedAt) : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.linearUser.userId,
          setWhere: eq(schema.linearUser.integrationId, integrationId),
          set: {
            email: user.email ?? null,
            name: user.name ?? null,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl ?? null,
            admin: user.admin ?? false,
            active: user.active ?? true,
            guest: user.guest ?? false,
            archivedAt: user.archivedAt ? new Date(user.archivedAt) : null,
            updatedAt: new Date(),
          },
        });
    });

    if (isTuple(batchUpserts)) {
      await db.batch(batchUpserts);
    }

    if (!users.pageInfo.hasNextPage) {
      break;
    }
    await users.fetchNext();
    maxIterations--;
  }
}
