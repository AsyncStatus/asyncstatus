import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { WebClient } from "@slack/web-api";
import { eq } from "drizzle-orm";
import * as schema from "../../db";
import { createDb } from "../../db/db";
import type { HonoEnv } from "../../lib/env";
import { createReportStatusFn } from "./steps/common";
import { fetchAndSyncChannels } from "./steps/fetch-and-sync-channels";

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
  }
}
