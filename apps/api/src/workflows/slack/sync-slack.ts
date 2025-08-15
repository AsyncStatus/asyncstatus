import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { dayjs } from "@asyncstatus/dayjs";
import { WebClient } from "@slack/web-api";
import { eq } from "drizzle-orm";
import * as schema from "../../db";
import { createDb } from "../../db/db";
import type { HonoEnv } from "../../lib/env";
import { createReportStatusFn } from "./steps/common";
import { fetchAndSyncChannels } from "./steps/fetch-and-sync-channels";
import { fetchAndSyncMessages } from "./steps/fetch-and-sync-messages";
import { fetchAndSyncUsers } from "./steps/fetch-and-sync-users";

export type SyncSlackWorkflowParams = { integrationId: string };

export class SyncSlackWorkflow extends WorkflowEntrypoint<
  HonoEnv["Bindings"],
  SyncSlackWorkflowParams
> {
  async run(event: WorkflowEvent<SyncSlackWorkflowParams>, step: WorkflowStep) {
    const { integrationId } = event.payload;
    const db = createDb(this.env);
    const integration = await db.query.slackIntegration.findFirst({
      where: eq(schema.slackIntegration.id, integrationId),
      with: { organization: true },
    });
    if (!integration) {
      throw new Error("Integration not found");
    }

    await step.do("fetch-and-sync-channels", async () => {
      const db = createDb(this.env);
      const integration = await db.query.slackIntegration.findFirst({
        where: eq(schema.slackIntegration.id, integrationId),
        with: { organization: true },
      });
      if (!integration) {
        throw new Error("Integration not found");
      }
      const slackClient = new WebClient(integration.botAccessToken);

      const reportStatusFn = createReportStatusFn({ db, integrationId });

      return await reportStatusFn(() => fetchAndSyncChannels({ slackClient, db, integrationId }));
    });

    await step.do("fetch-and-sync-users", async () => {
      const db = createDb(this.env);
      const integration = await db.query.slackIntegration.findFirst({
        where: eq(schema.slackIntegration.id, integrationId),
        with: { organization: true },
      });
      if (!integration) {
        throw new Error("Integration not found");
      }
      const slackClient = new WebClient(integration.botAccessToken);

      const reportStatusFn = createReportStatusFn({ db, integrationId });

      await reportStatusFn(() => fetchAndSyncUsers({ slackClient, db, integrationId }));
    });

    await step.do("fetch-and-sync-messages", async () => {
      const db = createDb(this.env);
      const integration = await db.query.slackIntegration.findFirst({
        where: eq(schema.slackIntegration.id, integrationId),
        with: { organization: true },
      });

      if (!integration) {
        throw new Error("Integration not found");
      }
      const slackClient = new WebClient(integration.botAccessToken);

      const reportStatusFn = createReportStatusFn({ db, integrationId });

      await reportStatusFn(async () => {
        const eventIds = await fetchAndSyncMessages({
          slackClient,
          db,
          integrationId,
          minEventCreatedAt: dayjs().startOf("week").toDate(),
        });

        if (eventIds.size > 0) {
          await this.env.SLACK_PROCESS_EVENTS_QUEUE.sendBatch(
            Array.from(eventIds).map((id) => ({ body: id, contentType: "text" })),
          );
        }
      });

      await db
        .update(schema.slackIntegration)
        .set({
          syncFinishedAt: new Date(),
          syncId: null,
          syncError: null,
          syncErrorAt: null,
          syncStartedAt: null,
        })
        .where(eq(schema.slackIntegration.id, integrationId));
    });
  }
}
