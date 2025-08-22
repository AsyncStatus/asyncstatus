import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { dayjs } from "@asyncstatus/dayjs";
import { eq } from "drizzle-orm";
import * as schema from "../../db";
import { createDb } from "../../db/db";
import type { HonoEnv } from "../../lib/env";
import { createLinearClient } from "../../lib/linear-client";
import { createReportStatusFn } from "./steps/common";
import { fetchAndSyncIssues } from "./steps/fetch-and-sync-issues";
import { fetchAndSyncProjects } from "./steps/fetch-and-sync-projects";
import { fetchAndSyncTeams } from "./steps/fetch-and-sync-teams";
import { fetchAndSyncUsers } from "./steps/fetch-and-sync-users";

export type SyncLinearWorkflowParams = {
  integrationId: string;
};

export class SyncLinearWorkflow extends WorkflowEntrypoint<
  HonoEnv["Bindings"],
  SyncLinearWorkflowParams
> {
  async run(event: WorkflowEvent<SyncLinearWorkflowParams>, step: WorkflowStep) {
    const { integrationId } = event.payload;
    const db = createDb(this.env);
    const integration = await db.query.linearIntegration.findFirst({
      where: eq(schema.linearIntegration.id, integrationId),
      with: { organization: true },
    });
    if (!integration) {
      throw new Error("Integration not found");
    }

    await step.do("fetch-and-sync-teams", async () => {
      const db = createDb(this.env);
      const integration = await db.query.linearIntegration.findFirst({
        where: eq(schema.linearIntegration.id, integrationId),
        with: { organization: true },
      });
      if (!integration) {
        throw new Error("Integration not found");
      }
      const linearClient = createLinearClient({ accessToken: integration.accessToken });

      const reportStatusFn = createReportStatusFn({ db, integrationId });

      return await reportStatusFn(() => fetchAndSyncTeams({ linearClient, db, integrationId }));
    });

    await step.do("fetch-and-sync-users", async () => {
      const db = createDb(this.env);
      const integration = await db.query.linearIntegration.findFirst({
        where: eq(schema.linearIntegration.id, integrationId),
        with: { organization: true },
      });
      if (!integration) {
        throw new Error("Integration not found");
      }
      const linearClient = createLinearClient({ accessToken: integration.accessToken });

      const reportStatusFn = createReportStatusFn({ db, integrationId });

      return await reportStatusFn(() => fetchAndSyncUsers({ linearClient, db, integrationId }));
    });

    await step.do("fetch-and-sync-projects", async () => {
      const db = createDb(this.env);
      const integration = await db.query.linearIntegration.findFirst({
        where: eq(schema.linearIntegration.id, integrationId),
        with: { organization: true },
      });
      if (!integration) {
        throw new Error("Integration not found");
      }
      const linearClient = createLinearClient({ accessToken: integration.accessToken });

      const reportStatusFn = createReportStatusFn({ db, integrationId });

      return await reportStatusFn(() => fetchAndSyncProjects({ linearClient, db, integrationId }));
    });

    await step.do("fetch-and-sync-issues", async () => {
      const db = createDb(this.env);
      const integration = await db.query.linearIntegration.findFirst({
        where: eq(schema.linearIntegration.id, integrationId),
        with: { organization: true },
      });
      if (!integration) {
        throw new Error("Integration not found");
      }
      const linearClient = createLinearClient({ accessToken: integration.accessToken });

      const reportStatusFn = createReportStatusFn({ db, integrationId });

      await reportStatusFn(async () => {
        const eventIds = await fetchAndSyncIssues({
          linearClient,
          db,
          integrationId,
          minIssueCreatedAt: dayjs().startOf("week").toDate(),
        });

        if (eventIds.size > 0) {
          await this.env.LINEAR_PROCESS_EVENTS_QUEUE.sendBatch(
            Array.from(eventIds).map((id) => ({ body: id, contentType: "text" })),
          );
        }
      });

      await db
        .update(schema.linearIntegration)
        .set({
          syncFinishedAt: new Date(),
          syncId: null,
          syncError: null,
          syncErrorAt: null,
          syncStartedAt: null,
        })
        .where(eq(schema.linearIntegration.id, integrationId));
    });
  }
}