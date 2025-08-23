import type { LinearClient } from "@linear/sdk";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import * as schema from "../../../db";
import type { Db } from "../../../db/db";
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
  const users = await linearClient.users({
    includeArchived: false,
  });

  console.log("users", users);

  if (users.nodes.length === 0) {
    return;
  }

  const batchUpserts = users.nodes.map((user) => {
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
}
