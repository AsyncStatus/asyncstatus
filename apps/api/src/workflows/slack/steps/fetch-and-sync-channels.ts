import type { WebClient } from "@slack/web-api";
import type { Channel } from "@slack/web-api/dist/types/response/ConversationsListResponse";
import { generateId } from "better-auth";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type * as schema from "../../../db";
import type { Db } from "../../../db/db";
import type { AnyGithubWebhookEventDefinition } from "../../../lib/github-event-definition";
import { isTuple } from "../../../lib/is-tuple";
import { standardizeGithubEventName } from "../../../lib/standardize-github-event-name";

type FetchAndSyncChannelsParams = {
  slackClient: WebClient;
  db: Db;
  integrationId: string;
};

export async function fetchAndSyncChannels({
  slackClient,
  db,
  integrationId,
}: FetchAndSyncChannelsParams) {
  for await (const page of slackClient.paginate("conversations.list", {
    types: "public_channel,private_channel",
    limit: 999,
  })) {
    if (!page.ok) {
      throw new Error(page.error);
    }

    const channelsToInsert: schema.SlackChannelInsert[] = [];

    for (const _channel of (page as any).channels ?? []) {
      const channel = _channel as Channel;
      if (!channel.id) {
        console.log("Skipping channel with no id");
        continue;
      }
      if (!channel.name) {
        console.log("Skipping channel with no name");
        continue;
      }

      channelsToInsert.push({
        id: generateId(),
        integrationId,
        name: channel.name,
        isPrivate: channel.is_private ?? false,
        isArchived: channel.is_archived ?? false,
        channelId: channel.id,
        isGeneral: channel.is_general ?? false,
        purpose: channel.purpose?.value,
        topic: channel.topic?.value,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    //   const batchUpserts = events.map((event) => {
    //     return db
    //       .insert(schema.githubEvent)
    //       .values({
    //         id: nanoid(),
    //         githubId: event.id.toString(),
    //         githubActorId: event.actor.id.toString(),
    //         insertedAt: new Date(),
    //         createdAt: event.created_at ? new Date(event.created_at) : new Date(),
    //         repositoryId: repo.id,
    //         type: standardizeGithubEventName(event.type ?? "UnknownEvent"),
    //         payload: event.payload as AnyGithubWebhookEventDefinition,
    //       })
    //       .onConflictDoUpdate({
    //         target: schema.githubEvent.githubId,
    //         setWhere: eq(schema.githubEvent.githubId, event.id.toString()),
    //         set: {
    //           insertedAt: new Date(),
    //           createdAt: event.created_at ? new Date(event.created_at) : new Date(),
    //           repositoryId: repo.id,
    //           type: standardizeGithubEventName(event.type ?? "UnknownEvent"),
    //           githubActorId: event.actor.id.toString(),
    //           payload: event.payload as AnyGithubWebhookEventDefinition,
    //         },
    //       });
    //   });
    //   if (isTuple(batchUpserts)) {
    //     await db.batch(batchUpserts);
    //   }
  }
}
