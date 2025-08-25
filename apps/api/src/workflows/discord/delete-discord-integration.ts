import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import * as schema from "@asyncstatus/db";
import { createDb } from "@asyncstatus/db/create-db";
import { eq } from "drizzle-orm";
import type { HonoEnv } from "../../lib/env";

export type DeleteDiscordIntegrationWorkflowParams = { integrationId: string };

export class DeleteDiscordIntegrationWorkflow extends WorkflowEntrypoint<
  HonoEnv["Bindings"],
  DeleteDiscordIntegrationWorkflowParams
> {
  async run(event: WorkflowEvent<DeleteDiscordIntegrationWorkflowParams>, step: WorkflowStep) {
    const { integrationId } = event.payload;

    await step.do("delete-discord-integration", async () => {
      const db = createDb(this.env);

      // Check if integration exists
      const integration = await db.query.discordIntegration.findFirst({
        where: eq(schema.discordIntegration.id, integrationId),
      });

      if (!integration) {
        console.error(`Discord integration ${integrationId} not found`);
        return;
      }

      try {
        // Delete the integration (cascades to related tables)
        await db
          .delete(schema.discordIntegration)
          .where(eq(schema.discordIntegration.id, integrationId));

        console.log(`Successfully deleted Discord integration ${integrationId}`);
      } catch (error) {
        console.error(`Failed to delete Discord integration ${integrationId}:`, error);

        // Update the integration with error status
        await db
          .update(schema.discordIntegration)
          .set({
            deleteError: error instanceof Error ? error.message : "Unknown error",
            deleteId: null,
          })
          .where(eq(schema.discordIntegration.id, integrationId));

        throw error;
      }
    });
  }
}
