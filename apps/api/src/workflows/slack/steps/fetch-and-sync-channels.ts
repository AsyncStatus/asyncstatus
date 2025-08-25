import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import type { WebClient } from "@slack/web-api";
import type { Channel } from "@slack/web-api/dist/types/response/ConversationsListResponse";
import { generateId } from "better-auth";
import { eq } from "drizzle-orm";
import { isTuple } from "../../../lib/is-tuple";

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
        isIm: channel.is_im ?? false,
        isMpim: channel.is_mpim ?? false,
        isGroup: channel.is_group ?? false,
        isShared: channel.is_shared ?? false,
        purpose: channel.purpose?.value,
        topic: channel.topic?.value,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const batchUpserts = channelsToInsert.map((channel) => {
      return db
        .insert(schema.slackChannel)
        .values(channel)
        .onConflictDoUpdate({
          target: schema.slackChannel.channelId,
          setWhere: eq(schema.slackChannel.channelId, channel.channelId),
          set: {
            name: channel.name,
            isPrivate: channel.isPrivate,
            isArchived: channel.isArchived,
            isGeneral: channel.isGeneral,
            isIm: channel.isIm,
            isMpim: channel.isMpim,
            isGroup: channel.isGroup,
            isShared: channel.isShared,
            purpose: channel.purpose,
            topic: channel.topic,
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
