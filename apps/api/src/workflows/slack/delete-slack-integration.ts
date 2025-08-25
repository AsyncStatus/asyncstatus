import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import * as schema from "@asyncstatus/db";
import { createDb } from "@asyncstatus/db/create-db";
import { WebClient } from "@slack/web-api";
import { eq } from "drizzle-orm";
import type { HonoEnv } from "../../lib/env";

export type DeleteSlackIntegrationWorkflowParams = {
  integrationId: string;
};

export class DeleteSlackIntegrationWorkflow extends WorkflowEntrypoint<
  HonoEnv["Bindings"],
  DeleteSlackIntegrationWorkflowParams
> {
  async run(event: WorkflowEvent<DeleteSlackIntegrationWorkflowParams>, step: WorkflowStep) {
    const { integrationId } = event.payload;
    const db = createDb(this.env);
    const integration = await db.query.slackIntegration.findFirst({
      where: eq(schema.slackIntegration.id, integrationId),
    });
    if (!integration) {
      throw new Error("Integration not found");
    }

    await step.do("delete-installation", async () => {
      const integration = await db.query.slackIntegration.findFirst({
        where: eq(schema.slackIntegration.id, integrationId),
      });
      if (!integration) {
        throw new Error("Integration not found");
      }

      const slackClient = new WebClient(integration.botAccessToken);

      await slackClient.auth.revoke();

      await db
        .delete(schema.slackChannel)
        .where(eq(schema.slackChannel.integrationId, integrationId));
      await db.delete(schema.slackUser).where(eq(schema.slackUser.integrationId, integrationId));
      await db.delete(schema.slackIntegration).where(eq(schema.slackIntegration.id, integrationId));
    });
  }
}
