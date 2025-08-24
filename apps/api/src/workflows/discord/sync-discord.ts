import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { dayjs, getStartOfWeek } from "@asyncstatus/dayjs";
import { and, eq } from "drizzle-orm";
import * as schema from "../../db";
import { createDb } from "../../db/db";
import type { HonoEnv } from "../../lib/env";
import { createReportStatusFn } from "./steps/common";
import { fetchAndSyncChannels } from "./steps/fetch-and-sync-channels";
import { fetchAndSyncMessages } from "./steps/fetch-and-sync-messages";
import { fetchAndSyncUsers } from "./steps/fetch-and-sync-users";

export type SyncDiscordWorkflowParams = {
  integrationId: string;
  createdByUserId?: schema.User["id"];
};

export class SyncDiscordWorkflow extends WorkflowEntrypoint<
  HonoEnv["Bindings"],
  SyncDiscordWorkflowParams
> {
  async run(event: WorkflowEvent<SyncDiscordWorkflowParams>, step: WorkflowStep) {
    const { integrationId } = event.payload;
    const db = createDb(this.env);
    const integration = await db.query.discordIntegration.findFirst({
      where: eq(schema.discordIntegration.id, integrationId),
      with: { organization: true },
    });
    if (!integration) {
      throw new Error("Integration not found");
    }

    await step.do("fetch-and-sync-channels", async () => {
      const db = createDb(this.env);
      const integration = await db.query.discordIntegration.findFirst({
        where: eq(schema.discordIntegration.id, integrationId),
        with: { organization: true, servers: true },
      });
      if (!integration) {
        throw new Error("Integration not found");
      }

      const reportStatusFn = createReportStatusFn({ db, integrationId });

      return await reportStatusFn(() =>
        fetchAndSyncChannels({
          botToken: integration.botAccessToken,
          db,
          integrationId,
          servers: integration.servers,
        }),
      );
    });

    await step.do("fetch-and-sync-users", async () => {
      const db = createDb(this.env);
      const integration = await db.query.discordIntegration.findFirst({
        where: eq(schema.discordIntegration.id, integrationId),
        with: { organization: true, servers: true },
      });
      if (!integration) {
        throw new Error("Integration not found");
      }

      const reportStatusFn = createReportStatusFn({ db, integrationId });

      await reportStatusFn(() =>
        fetchAndSyncUsers({
          botToken: integration.botAccessToken,
          db,
          integrationId,
          servers: integration.servers,
        }),
      );
    });

    await step.do("fetch-and-sync-messages", async () => {
      const db = createDb(this.env);
      const integration = await db.query.discordIntegration.findFirst({
        where: eq(schema.discordIntegration.id, integrationId),
        with: { organization: true },
      });
      if (!integration) {
        throw new Error("Integration not found");
      }
      let userDiscordAccessToken: string | null = null;
      if (event.payload.createdByUserId) {
        const account = await db.query.account.findFirst({
          where: and(
            eq(schema.account.providerId, "discord"),
            eq(schema.account.userId, event.payload.createdByUserId),
          ),
        });
        userDiscordAccessToken = account?.accessToken ?? null;
      }

      const reportStatusFn = createReportStatusFn({ db, integrationId });

      await reportStatusFn(async () => {
        const eventIds = await fetchAndSyncMessages({
          botToken: userDiscordAccessToken ?? integration.botAccessToken,
          db,
          integrationId,
          minEventCreatedAt: getStartOfWeek().toDate(),
        });

        if (eventIds.size > 0) {
          await this.env.DISCORD_PROCESS_EVENTS_QUEUE.sendBatch(
            Array.from(eventIds).map((id) => ({ body: id, contentType: "text" })),
          );
        }
      });

      await db
        .update(schema.discordIntegration)
        .set({
          syncFinishedAt: new Date(),
          syncId: null,
          syncError: null,
          syncErrorAt: null,
          syncStartedAt: null,
        })
        .where(eq(schema.discordIntegration.id, integrationId));
    });
  }
}
