import {
  WorkflowEntrypoint,
  WorkflowStep,
  type WorkflowEvent,
} from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { App } from "octokit";

import { createDb } from "../db";
import * as schema from "../db/schema";
import type { HonoEnv } from "../lib/env";

export type SyncGithubWorkflowParams = { integrationId: string };

export class SyncGithubWorkflow extends WorkflowEntrypoint<
  HonoEnv["Bindings"],
  SyncGithubWorkflowParams
> {
  async run(
    event: WorkflowEvent<SyncGithubWorkflowParams>,
    step: WorkflowStep,
  ) {
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

    await step.do("sync-users", async () => {
      const app = new App({
        appId: this.env.GITHUB_APP_ID,
        privateKey: this.env.GITHUB_APP_PRIVATE_KEY,
      });
      const octokit = await app.getInstallationOctokit(
        Number(integration.installationId),
      );
      const repos = await octokit.rest.apps.listReposAccessibleToInstallation();
      if (repos.status !== 200) {
        throw new Error("Failed to fetch repositories");
      }
      const existingUsers = await db.query.githubUser.findMany({
        where: eq(schema.githubUser.integrationId, integrationId),
      });
      console.log(repos);
      console.log(existingUsers);

      for (const repo of repos.data.repositories) {
        const users = await octokit.rest.repos.listCollaborators({
          owner: repo.owner.login,
          repo: repo.name,
          affiliation: "all",
        });
        const existingUserIds = existingUsers.map((user) => user.githubId);
        const newUsers = users.data.filter(
          (user) => !existingUserIds.includes(user.id.toString()),
        );
        const existingUsersToUpdate = users.data.filter((user) =>
          existingUserIds.includes(user.id.toString()),
        );

        if (newUsers.length > 0) {
          await db.batch(
            newUsers.map((user) => {
              return db.insert(schema.githubUser).values({
                id: nanoid(),
                integrationId,
                createdAt: new Date(),
                updatedAt: new Date(),
                githubId: user.id.toString(),
                login: user.login,
                avatarUrl: user.avatar_url,
                htmlUrl: user.html_url,
                name: user.name,
                email: user.email,
              });
            }) as any,
          );
        }

        // Update existing users
        if (existingUsersToUpdate.length > 0) {
          await db.batch(
            existingUsersToUpdate.map((user) => {
              const existingUser = existingUsers.find(
                (eu) => eu.githubId === user.id.toString(),
              );
              return db
                .update(schema.githubUser)
                .set({
                  updatedAt: new Date(),
                  login: user.login,
                  avatarUrl: user.avatar_url,
                  htmlUrl: user.html_url,
                  name: user.name,
                  email: user.email,
                })
                .where(eq(schema.githubUser.id, existingUser!.id));
            }) as any,
          );
        }
      }
    });

    await step.do("sync-repositories", async () => {
      const app = new App({
        appId: this.env.GITHUB_APP_ID,
        privateKey: this.env.GITHUB_APP_PRIVATE_KEY,
      });
      const octokit = await app.getInstallationOctokit(
        Number(integration.installationId),
      );
      const repos = await octokit.rest.apps.listReposAccessibleToInstallation();
      if (repos.status !== 200) {
        throw new Error("Failed to fetch repositories");
      }
      const existingRepos = await db.query.githubRepository.findMany({
        where: eq(schema.githubRepository.integrationId, integrationId),
      });
      const existingRepoIds = existingRepos.map((repo) => repo.repoId);
      const newRepos = repos.data.repositories.filter(
        (repo) => !existingRepoIds.includes(`${repo.id}`),
      );
      const reposToUpdate = repos.data.repositories.filter((repo) =>
        existingRepoIds.includes(`${repo.id}`),
      );

      // Insert new repositories
      if (newRepos.length > 0) {
        await db.batch(
          newRepos.map((repo) => {
            return db
              .insert(schema.githubRepository)
              .values({
                id: nanoid(),
                integrationId,
                repoId: repo.id.toString(),
                name: repo.name,
                fullName: repo.full_name,
                private: repo.private,
                htmlUrl: repo.html_url,
                createdAt: new Date(),
                updatedAt: new Date(),
                description: repo.description,
              })
              .returning({ id: schema.githubRepository.id });
          }) as any,
        );
      }

      // Update existing repositories
      if (reposToUpdate.length > 0) {
        await db.batch(
          reposToUpdate.map((repo) => {
            const existingRepo = existingRepos.find(
              (er) => er.repoId === repo.id.toString(),
            );
            return db
              .update(schema.githubRepository)
              .set({
                name: repo.name,
                fullName: repo.full_name,
                private: repo.private,
                htmlUrl: repo.html_url,
                updatedAt: new Date(),
                description: repo.description,
              })
              .where(eq(schema.githubRepository.id, existingRepo!.id));
          }) as any,
        );
      }
    });

    await step.do("update-integration", async () => {
      await db
        .update(schema.githubIntegration)
        .set({ syncId: null, syncStatus: "completed" })
        .where(eq(schema.githubIntegration.id, integrationId));
    });
  }
}
