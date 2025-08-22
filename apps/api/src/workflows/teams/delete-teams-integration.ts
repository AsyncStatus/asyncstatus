import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import * as schema from "../../db";
import { createDb } from "../../db/db";
import type { HonoEnv } from "../../lib/env";

export type DeleteTeamsIntegrationWorkflowParams = {
  integrationId: string;
};

export class DeleteTeamsIntegrationWorkflow extends WorkflowEntrypoint<
  HonoEnv["Bindings"],
  DeleteTeamsIntegrationWorkflowParams
> {
  async run(event: WorkflowEvent<DeleteTeamsIntegrationWorkflowParams>, step: WorkflowStep) {
    const { integrationId } = event.payload;

    await step.do("delete-teams-events", async () => {
      const db = createDb(this.env);
      await db.delete(schema.teamsEvent).where(eq(schema.teamsEvent.integrationId, integrationId));
    });

    await step.do("delete-teams-channels", async () => {
      const db = createDb(this.env);
      await db
        .delete(schema.teamsChannel)
        .where(eq(schema.teamsChannel.integrationId, integrationId));
    });

    await step.do("delete-teams-users", async () => {
      const db = createDb(this.env);
      await db.delete(schema.teamsUser).where(eq(schema.teamsUser.integrationId, integrationId));
    });

    await step.do("delete-teams-integration", async () => {
      const db = createDb(this.env);
      await db
        .delete(schema.teamsIntegration)
        .where(eq(schema.teamsIntegration.id, integrationId));
    });
  }
}