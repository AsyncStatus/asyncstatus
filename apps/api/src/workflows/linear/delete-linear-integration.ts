import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import * as schema from "../../db";
import { createDb } from "../../db/db";
import type { HonoEnv } from "../../lib/env";
import { revokeLinearToken } from "../../lib/linear-client";

export type DeleteLinearIntegrationWorkflowParams = {
  integrationId: string;
};

export class DeleteLinearIntegrationWorkflow extends WorkflowEntrypoint<
  HonoEnv["Bindings"],
  DeleteLinearIntegrationWorkflowParams
> {
  async run(event: WorkflowEvent<DeleteLinearIntegrationWorkflowParams>, step: WorkflowStep) {
    const { integrationId } = event.payload;

    await step.do("revoke-linear-token", async () => {
      const db = createDb(this.env);
      const integration = await db.query.linearIntegration.findFirst({
        where: eq(schema.linearIntegration.id, integrationId),
      });

      if (!integration) {
        console.warn("Linear integration not found, skipping token revocation");
        return;
      }

      try {
        await revokeLinearToken({
          accessToken: integration.accessToken,
          clientId: this.env.LINEAR_CLIENT_ID,
          clientSecret: this.env.LINEAR_CLIENT_SECRET,
        });
      } catch (error) {
        console.error("Failed to revoke Linear token:", error);
        await db
          .update(schema.linearIntegration)
          .set({
            deleteError: error instanceof Error ? error.message : "Failed to revoke token",
          })
          .where(eq(schema.linearIntegration.id, integrationId));
      }
    });

    await step.do("delete-linear-data", async () => {
      const db = createDb(this.env);
      
      try {
        await db.delete(schema.linearIntegration).where(eq(schema.linearIntegration.id, integrationId));
      } catch (error) {
        console.error("Failed to delete Linear integration data:", error);
        await db
          .update(schema.linearIntegration)
          .set({
            deleteId: null,
            deleteError: error instanceof Error ? error.message : "Failed to delete integration data",
          })
          .where(eq(schema.linearIntegration.id, integrationId));
        throw error;
      }
    });
  }
}