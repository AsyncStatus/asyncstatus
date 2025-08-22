import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { dayjs } from "@asyncstatus/dayjs";
import { and, eq } from "drizzle-orm";
import * as schema from "../../db";
import { createDb } from "../../db/db";
import type { HonoEnv } from "../../lib/env";
import { createReportStatusFn } from "./steps/common";
import { fetchAndSyncTeamsAndChannels } from "./steps/fetch-and-sync-teams";
import { fetchAndSyncMessages } from "./steps/fetch-and-sync-messages";
import { fetchAndSyncUsers } from "./steps/fetch-and-sync-users";

export type SyncTeamsWorkflowParams = {
  integrationId: string;
  createdByUserId?: schema.User["id"];
};

export class SyncTeamsWorkflow extends WorkflowEntrypoint<
  HonoEnv["Bindings"],
  SyncTeamsWorkflowParams
> {
  async run(event: WorkflowEvent<SyncTeamsWorkflowParams>, step: WorkflowStep) {
    const { integrationId } = event.payload;
    const db = createDb(this.env);
    const integration = await db.query.teamsIntegration.findFirst({
      where: eq(schema.teamsIntegration.id, integrationId),
      with: { organization: true },
    });
    if (!integration) {
      throw new Error("Integration not found");
    }

    await step.do("fetch-and-sync-teams-and-channels", async () => {
      const db = createDb(this.env);
      const integration = await db.query.teamsIntegration.findFirst({
        where: eq(schema.teamsIntegration.id, integrationId),
        with: { organization: true },
      });
      if (!integration) {
        throw new Error("Integration not found");
      }

      const reportStatusFn = createReportStatusFn({ db, integrationId });

      return await reportStatusFn(() =>
        fetchAndSyncTeamsAndChannels({
          db,
          integrationId,
          graphAccessToken: integration.graphAccessToken || integration.botAccessToken,
          tenantId: integration.tenantId,
        })
      );
    });

    await step.do("fetch-and-sync-users", async () => {
      const db = createDb(this.env);
      const integration = await db.query.teamsIntegration.findFirst({
        where: eq(schema.teamsIntegration.id, integrationId),
        with: { organization: true },
      });
      if (!integration) {
        throw new Error("Integration not found");
      }

      const reportStatusFn = createReportStatusFn({ db, integrationId });

      await reportStatusFn(() =>
        fetchAndSyncUsers({
          db,
          integrationId,
          graphAccessToken: integration.graphAccessToken || integration.botAccessToken,
          tenantId: integration.tenantId,
        })
      );
    });

    await step.do("fetch-and-sync-messages", async () => {
      const db = createDb(this.env);
      const integration = await db.query.teamsIntegration.findFirst({
        where: eq(schema.teamsIntegration.id, integrationId),
        with: { organization: true },
      });
      if (!integration) {
        throw new Error("Integration not found");
      }

      let userAccessToken: string | null = null;
      if (event.payload.createdByUserId) {
        const account = await db.query.account.findFirst({
          where: and(
            eq(schema.account.providerId, "teams"),
            eq(schema.account.userId, event.payload.createdByUserId),
          ),
        });
        userAccessToken = account?.accessToken ?? null;
      }

      const reportStatusFn = createReportStatusFn({ db, integrationId });

      await reportStatusFn(async () => {
        const eventIds = await fetchAndSyncMessages({
          db,
          integrationId,
          graphAccessToken: userAccessToken || integration.graphAccessToken || integration.botAccessToken,
          tenantId: integration.tenantId,
          deltaLink: integration.deltaLink,
          minEventCreatedAt: dayjs().startOf("week").toDate(),
        });

        if (eventIds.size > 0) {
          await this.env.TEAMS_PROCESS_EVENTS_QUEUE.sendBatch(
            Array.from(eventIds).map((id) => ({ body: id, contentType: "text" })),
          );
        }
      });

      await db
        .update(schema.teamsIntegration)
        .set({
          syncFinishedAt: new Date(),
          syncId: null,
          syncError: null,
          syncErrorAt: null,
          syncStartedAt: null,
        })
        .where(eq(schema.teamsIntegration.id, integrationId));
    });
  }
}