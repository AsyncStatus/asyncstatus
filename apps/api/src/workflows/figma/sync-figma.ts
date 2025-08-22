import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { dayjs } from "@asyncstatus/dayjs";
import { eq } from "drizzle-orm";
import * as schema from "../../db";
import { createDb } from "../../db/db";
import type { HonoEnv } from "../../lib/env";
import { createReportStatusFn } from "./steps/common";
import { fetchAndSyncTeams } from "./steps/fetch-and-sync-teams";
import { fetchAndSyncProjects } from "./steps/fetch-and-sync-projects";
import { fetchAndSyncFiles } from "./steps/fetch-and-sync-files";
import { fetchAndSyncUsers } from "./steps/fetch-and-sync-users";

export type SyncFigmaWorkflowParams = {
  integrationId: string;
  createdByUserId?: schema.User["id"];
};

export class SyncFigmaWorkflow extends WorkflowEntrypoint<
  HonoEnv["Bindings"],
  SyncFigmaWorkflowParams
> {
  async run(event: WorkflowEvent<SyncFigmaWorkflowParams>, step: WorkflowStep) {
    const { integrationId } = event.payload;
    const db = createDb(this.env);
    
    const integration = await db.query.figmaIntegration.findFirst({
      where: eq(schema.figmaIntegration.id, integrationId),
      with: { organization: true },
    });
    
    if (!integration) {
      throw new Error("Integration not found");
    }

    // Step 1: Fetch and sync teams
    await step.do("fetch-and-sync-teams", async () => {
      const db = createDb(this.env);
      const integration = await db.query.figmaIntegration.findFirst({
        where: eq(schema.figmaIntegration.id, integrationId),
      });
      
      if (!integration) {
        throw new Error("Integration not found");
      }

      const reportStatusFn = createReportStatusFn({ db, integrationId });

      return await reportStatusFn(() => 
        fetchAndSyncTeams({
          accessToken: integration.accessToken,
          db,
          integrationId,
        })
      );
    });

    // Step 2: Fetch and sync projects
    await step.do("fetch-and-sync-projects", async () => {
      const db = createDb(this.env);
      const integration = await db.query.figmaIntegration.findFirst({
        where: eq(schema.figmaIntegration.id, integrationId),
      });
      
      if (!integration) {
        throw new Error("Integration not found");
      }

      const reportStatusFn = createReportStatusFn({ db, integrationId });

      return await reportStatusFn(() =>
        fetchAndSyncProjects({
          accessToken: integration.accessToken,
          db,
          integrationId,
        })
      );
    });

    // Step 3: Fetch and sync files (with recent filter)
    const fileKeys = await step.do("fetch-and-sync-files", async () => {
      const db = createDb(this.env);
      const integration = await db.query.figmaIntegration.findFirst({
        where: eq(schema.figmaIntegration.id, integrationId),
      });
      
      if (!integration) {
        throw new Error("Integration not found");
      }

      const reportStatusFn = createReportStatusFn({ db, integrationId });

      const result = await reportStatusFn(() =>
        fetchAndSyncFiles({
          accessToken: integration.accessToken,
          db,
          integrationId,
          minFileModifiedAt: dayjs().startOf("week").toDate(),
        })
      );

      return result.fileKeys;
    });

    // Step 4: Fetch and sync users
    await step.do("fetch-and-sync-users", async () => {
      const db = createDb(this.env);
      const integration = await db.query.figmaIntegration.findFirst({
        where: eq(schema.figmaIntegration.id, integrationId),
      });
      
      if (!integration) {
        throw new Error("Integration not found");
      }

      const reportStatusFn = createReportStatusFn({ db, integrationId });

      return await reportStatusFn(() =>
        fetchAndSyncUsers({
          accessToken: integration.accessToken,
          db,
          integrationId,
        })
      );
    });

    // Step 5: Register webhooks for files
    await step.do("register-webhooks", async () => {
      const db = createDb(this.env);
      const integration = await db.query.figmaIntegration.findFirst({
        where: eq(schema.figmaIntegration.id, integrationId),
      });
      
      if (!integration) {
        throw new Error("Integration not found");
      }

      // Generate webhook secret if not exists
      let webhookSecret = integration.webhookSecret;
      if (!webhookSecret) {
        const { generateId } = await import("better-auth");
        webhookSecret = generateId();
        
        await db
          .update(schema.figmaIntegration)
          .set({ webhookSecret })
          .where(eq(schema.figmaIntegration.id, integrationId));
      }

      // Register webhooks for each file (limited to prevent rate limiting)
      const filesToRegister = Array.from(fileKeys).slice(0, 10);
      
      for (const fileKey of filesToRegister) {
        try {
          const response = await fetch("https://api.figma.com/v2/webhooks", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${integration.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              event_type: "FILE_UPDATE",
              team_id: integration.teamId,
              endpoint: `${this.env.BETTER_AUTH_URL}/api/figma/webhook`,
              passcode: webhookSecret,
              description: `AsyncStatus sync for ${fileKey}`,
            }),
          });

          if (!response.ok) {
            console.error(`Failed to register webhook for file ${fileKey}:`, await response.text());
          }
        } catch (error) {
          console.error(`Error registering webhook for file ${fileKey}:`, error);
        }
      }

      return { webhooksRegistered: filesToRegister.length };
    });

    // Step 6: Finalize sync
    await step.do("finalize-sync", async () => {
      const db = createDb(this.env);
      
      await db
        .update(schema.figmaIntegration)
        .set({
          syncFinishedAt: new Date(),
          syncId: null,
          syncError: null,
          syncErrorAt: null,
          syncStartedAt: null,
        })
        .where(eq(schema.figmaIntegration.id, integrationId));
    });
  }
}