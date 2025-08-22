import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import * as schema from "../../db";
import { createDb } from "../../db/db";
import type { HonoEnv } from "../../lib/env";

export type DeleteFigmaIntegrationWorkflowParams = {
  integrationId: string;
};

export class DeleteFigmaIntegrationWorkflow extends WorkflowEntrypoint<
  HonoEnv["Bindings"],
  DeleteFigmaIntegrationWorkflowParams
> {
  async run(event: WorkflowEvent<DeleteFigmaIntegrationWorkflowParams>, step: WorkflowStep) {
    const { integrationId } = event.payload;

    // Step 1: Delete webhooks from Figma
    await step.do("delete-webhooks", async () => {
      const db = createDb(this.env);
      const integration = await db.query.figmaIntegration.findFirst({
        where: eq(schema.figmaIntegration.id, integrationId),
      });

      if (!integration) {
        console.log("Integration not found, skipping webhook deletion");
        return;
      }

      // List all webhooks for the team
      try {
        const response = await fetch(
          `https://api.figma.com/v2/teams/${integration.teamId}/webhooks`,
          {
            headers: {
              Authorization: `Bearer ${integration.accessToken}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json() as {
            webhooks?: Array<{ id: string; passcode: string }>;
          };
          const webhooks = data.webhooks || [];

          // Delete each webhook
          for (const webhook of webhooks) {
            if (webhook.passcode === integration.webhookSecret) {
              try {
                await fetch(`https://api.figma.com/v2/webhooks/${webhook.id}`, {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${integration.accessToken}`,
                  },
                });
              } catch (error) {
                console.error(`Failed to delete webhook ${webhook.id}:`, error);
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to list/delete webhooks:", error);
      }
    });

    // Step 2: Mark integration for deletion
    await step.do("mark-for-deletion", async () => {
      const db = createDb(this.env);
      const { generateId } = await import("better-auth");
      const deleteId = generateId();

      await db
        .update(schema.figmaIntegration)
        .set({
          deleteId,
          syncId: null,
          syncError: null,
          syncErrorAt: null,
        })
        .where(eq(schema.figmaIntegration.id, integrationId));
    });

    // Step 3: Delete integration and all related data (cascade)
    await step.do("delete-integration", async () => {
      const db = createDb(this.env);
      
      try {
        await db
          .delete(schema.figmaIntegration)
          .where(eq(schema.figmaIntegration.id, integrationId));
      } catch (error) {
        // Update with error if deletion fails
        await db
          .update(schema.figmaIntegration)
          .set({
            deleteError: error instanceof Error ? error.message : String(error),
            deleteId: null,
          })
          .where(eq(schema.figmaIntegration.id, integrationId));
        throw error;
      }
    });
  }
}