import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { App } from "octokit";
import * as schema from "../../db";
import { createDb } from "../../db/db";
import type { HonoEnv } from "../../lib/env";

export type DeleteGithubIntegrationWorkflowParams = {
  integrationId: string;
};

export class DeleteGithubIntegrationWorkflow extends WorkflowEntrypoint<
  HonoEnv["Bindings"],
  DeleteGithubIntegrationWorkflowParams
> {
  async run(event: WorkflowEvent<DeleteGithubIntegrationWorkflowParams>, step: WorkflowStep) {
    const { integrationId } = event.payload;
    const db = createDb(this.env);

    const integration = await step.do("get-integration", async () => {
      const integration = await db.query.githubIntegration.findFirst({
        where: eq(schema.githubIntegration.id, integrationId),
      });
      if (!integration) {
        throw new Error("Integration not found");
      }

      return integration;
    });

    await step.do("delete-installation", async () => {
      const app = new App({
        appId: this.env.GITHUB_APP_ID,
        privateKey: this.env.GITHUB_APP_PRIVATE_KEY,
      });

      const octokit = await app.getInstallationOctokit(Number(integration.installationId));
      await octokit.rest.apps.deleteInstallation({
        installation_id: Number(integration.installationId),
      });
      await db
        .delete(schema.githubRepository)
        .where(eq(schema.githubRepository.integrationId, integrationId));
      await db.delete(schema.githubUser).where(eq(schema.githubUser.integrationId, integrationId));
      await db
        .delete(schema.githubIntegration)
        .where(eq(schema.githubIntegration.id, integrationId));
    });
  }
}
