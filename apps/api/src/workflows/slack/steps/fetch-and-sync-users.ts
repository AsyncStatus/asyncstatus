import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import type { WebClient } from "@slack/web-api";
import type { Member as SlackMemberResponse } from "@slack/web-api/dist/types/response/UsersListResponse";
import { generateId } from "better-auth";
import { eq } from "drizzle-orm";
import { isTuple } from "../../../lib/is-tuple";

type FetchAndSyncUsersParams = {
  slackClient: WebClient;
  db: Db;
  integrationId: string;
};

export async function fetchAndSyncUsers({
  slackClient,
  db,
  integrationId,
}: FetchAndSyncUsersParams) {
  for await (const page of slackClient.paginate("users.list", { limit: 999 })) {
    if (!page.ok) {
      throw new Error(page.error);
    }

    const usersToInsert: schema.SlackUserInsert[] = [];

    for (const _user of (page as any).members ?? []) {
      const user = _user as SlackMemberResponse;
      if (!user.id) {
        console.log("Skipping user with no id");
        continue;
      }
      if (!user.name) {
        console.log("Skipping user with no name");
        continue;
      }
      if (user.deleted) {
        console.log("Skipping deleted user");
        continue;
      }

      usersToInsert.push({
        id: generateId(),
        integrationId,
        slackUserId: user.id,
        username: user.name,
        displayName: user.profile?.display_name,
        email: user.profile?.email,
        avatarUrl: user.profile?.image_original,
        isBot: user.is_bot,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const batchUpserts = usersToInsert.map((user) => {
      return db
        .insert(schema.slackUser)
        .values(user)
        .onConflictDoUpdate({
          target: schema.slackUser.slackUserId,
          setWhere: eq(schema.slackUser.slackUserId, user.slackUserId),
          set: {
            username: user.username,
            displayName: user.displayName,
            email: user.email,
            avatarUrl: user.avatarUrl,
            isBot: user.isBot,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
    });
    if (isTuple(batchUpserts)) {
      await db.batch(batchUpserts);
    }
  }
}
