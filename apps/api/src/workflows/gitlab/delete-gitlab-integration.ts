import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import * as schema from "../../db";
import { createDb } from "../../db/db";
import type { HonoEnv } from "../../lib/env";

export type DeleteGitlabIntegrationWorkflowParams = {
  integrationId: string;
};

export class DeleteGitlabIntegrationWorkflow extends WorkflowEntrypoint<
  HonoEnv["Bindings"],
  DeleteGitlabIntegrationWorkflowParams
> {
  async run(event: WorkflowEvent<DeleteGitlabIntegrationWorkflowParams>, step: WorkflowStep) {
    const { integrationId } = event.payload;
    const db = createDb(this.env);

    const integration = await step.do("get-integration", async () => {
      const integration = await db.query.gitlabIntegration.findFirst({
        where: eq(schema.gitlabIntegration.id, integrationId),
      });
      if (!integration) {
        throw new Error("Integration not found");
      }

      return integration;
    });

    await step.do("delete-integration-data", async () => {
      // Delete related data in order (respecting foreign key constraints)
      // GitLab event vectors (references gitlab_event)
      await db
        .delete(schema.gitlabEventVector)
        .where(
          eq(
            schema.gitlabEventVector.eventId,
            db
              .select({ id: schema.gitlabEvent.id })
              .from(schema.gitlabEvent)
              .innerJoin(schema.gitlabProject, eq(schema.gitlabEvent.projectId, schema.gitlabProject.id))
              .where(eq(schema.gitlabProject.integrationId, integrationId))
          )
        );

      // GitLab events (references gitlab_project)  
      await db
        .delete(schema.gitlabEvent)
        .where(
          eq(
            schema.gitlabEvent.projectId,
            db
              .select({ id: schema.gitlabProject.id })
              .from(schema.gitlabProject)
              .where(eq(schema.gitlabProject.integrationId, integrationId))
          )
        );

      // GitLab projects (references gitlab_integration)
      await db
        .delete(schema.gitlabProject)
        .where(eq(schema.gitlabProject.integrationId, integrationId));

      // GitLab users (references gitlab_integration)
      await db
        .delete(schema.gitlabUser)
        .where(eq(schema.gitlabUser.integrationId, integrationId));

      // Finally, delete the integration itself
      await db
        .delete(schema.gitlabIntegration)
        .where(eq(schema.gitlabIntegration.id, integrationId));
    });
  }
}
