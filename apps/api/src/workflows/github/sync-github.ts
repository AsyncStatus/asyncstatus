import Anthropic from "@anthropic-ai/sdk";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import {
  WorkflowEntrypoint,
  WorkflowStep,
  type WorkflowEvent,
} from "cloudflare:workers";
import { count, desc, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { App } from "octokit";
import { VoyageAIClient } from "voyageai";

import { createDb } from "../../db";
import * as schema from "../../db/schema";
import type { HonoEnv } from "../../lib/env";

function getConfig() {
  const now = new Date();

  return {
    maxEventsPerRepo: 1000,
    oldestEventDate: subDays(now, 60),
  };
}

function subDays(date: Date, days: number) {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  newDate.setDate(newDate.getDate() - days);
  return newDate;
}

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
    const integration = await db.query.githubIntegration.findFirst({
      where: eq(schema.githubIntegration.id, integrationId),
      with: { organization: true },
    });
    if (!integration) {
      throw new Error("Integration not found");
    }

    const app = new App({
      appId: this.env.GITHUB_APP_ID,
      privateKey: this.env.GITHUB_APP_PRIVATE_KEY,
    });
    const octokit = await app.getInstallationOctokit(
      Number(integration.installationId),
    );

    const repositories = await step.do("fetch-repositories", async () => {
      async function getPaginated(page: number) {
        const repos = await octokit.rest.apps.listReposAccessibleToInstallation(
          {
            page,
            per_page: 100,
          },
        );
        if (repos.status !== 200) {
          throw new Error("Failed to fetch repositories");
        }
        return repos.data.repositories;
      }

      try {
        await db
          .update(schema.githubIntegration)
          .set({ syncStatus: SyncGithubWorkflowStatus.fetchingRepositories })
          .where(eq(schema.githubIntegration.id, integrationId));

        const repositories = [];
        let page = 1;
        let hasNextPage = true;
        while (hasNextPage) {
          const repos = await getPaginated(page);
          if (repos.length === 0) {
            hasNextPage = false;
            break;
          }
          repositories.push(...repos);
          hasNextPage = repos.length === 100;
          page++;
        }

        return repositories;
      } catch (error) {
        await db
          .update(schema.githubIntegration)
          .set({ syncError: "Failed to fetch repositories" })
          .where(eq(schema.githubIntegration.id, integrationId));
        throw error;
      }
    });

    await step.do("fetch-repositories-update-integration-status", async () => {
      await db
        .update(schema.githubIntegration)
        .set({ syncStatus: SyncGithubWorkflowStatus.fetchedRepositories })
        .where(eq(schema.githubIntegration.id, integrationId));
    });

    await step.do("sync-repositories", async () => {
      try {
        await db
          .update(schema.githubIntegration)
          .set({ syncStatus: SyncGithubWorkflowStatus.syncingRepositories })
          .where(eq(schema.githubIntegration.id, integrationId));

        if (repositories.length === 0) {
          return;
        }

        const batchUpserts = repositories.map((repo) => {
          return db
            .insert(schema.githubRepository)
            .values({
              id: nanoid(),
              integrationId,
              repoId: repo.id.toString(),
              owner: repo.owner.login,
              description: repo.description,
              name: repo.name,
              fullName: repo.full_name,
              private: repo.private,
              htmlUrl: repo.html_url,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: schema.githubRepository.repoId,
              setWhere: eq(
                schema.githubRepository.integrationId,
                integrationId,
              ),
              set: {
                description: repo.description,
                name: repo.name,
                fullName: repo.full_name,
                private: repo.private,
                htmlUrl: repo.html_url,
                updatedAt: new Date(),
              },
            });
        });

        // drizzle freaks out here
        await db.batch(batchUpserts as any);
      } catch (error) {
        await db
          .update(schema.githubIntegration)
          .set({ syncError: "Failed to sync repositories" })
          .where(eq(schema.githubIntegration.id, integrationId));
        throw error;
      }
    });

    await step.do("sync-repositories-update-integration-status", async () => {
      await db
        .update(schema.githubIntegration)
        .set({ syncStatus: SyncGithubWorkflowStatus.syncedRepositories })
        .where(eq(schema.githubIntegration.id, integrationId));
    });

    const githubUsers = await step.do("fetch-users", async () => {
      async function getPaginated(page: number) {
        const users = await octokit.rest.orgs.listMembers({
          org: integration!.organization.name,
          page,
          per_page: 100,
        });
        return users.data;
      }

      try {
        await db
          .update(schema.githubIntegration)
          .set({ syncStatus: SyncGithubWorkflowStatus.fetchingUsers })
          .where(eq(schema.githubIntegration.id, integrationId));

        const githubUsers = [];
        let page = 1;
        let hasNextPage = true;
        while (hasNextPage) {
          const users = await getPaginated(page);
          if (users.length === 0) {
            hasNextPage = false;
            break;
          }
          githubUsers.push(...users);
          hasNextPage = users.length === 100;
          page++;
        }
        return githubUsers;
      } catch (error) {
        await db
          .update(schema.githubIntegration)
          .set({ syncError: "Failed to fetch users" })
          .where(eq(schema.githubIntegration.id, integrationId));
        throw error;
      }
    });

    await step.do("fetch-users-update-integration-status", async () => {
      await db
        .update(schema.githubIntegration)
        .set({ syncStatus: SyncGithubWorkflowStatus.fetchedUsers })
        .where(eq(schema.githubIntegration.id, integrationId));
    });

    await step.do("sync-users", async () => {
      try {
        await db
          .update(schema.githubIntegration)
          .set({ syncStatus: SyncGithubWorkflowStatus.syncingUsers })
          .where(eq(schema.githubIntegration.id, integrationId));

        if (githubUsers.length === 0) {
          return;
        }

        const batchUpserts = githubUsers.map((user) => {
          return db
            .insert(schema.githubUser)
            .values({
              id: nanoid(),
              integrationId,
              githubId: user.id.toString(),
              login: user.login,
              avatarUrl: user.avatar_url,
              createdAt: new Date(),
              updatedAt: new Date(),
              htmlUrl: user.url,
              email: user.email,
            })
            .onConflictDoUpdate({
              target: schema.githubUser.githubId,
              setWhere: eq(schema.githubUser.integrationId, integrationId),
              set: {
                login: user.login,
                avatarUrl: user.avatar_url,
                updatedAt: new Date(),
                htmlUrl: user.url,
                email: user.email,
                name: user.name,
              },
            });
        });

        await db.batch(batchUpserts as any);
      } catch (error) {
        await db
          .update(schema.githubIntegration)
          .set({ syncError: "Failed to sync users" })
          .where(eq(schema.githubIntegration.id, integrationId));
        throw error;
      }
    });

    await step.do("sync-users-update-integration-status", async () => {
      await db
        .update(schema.githubIntegration)
        .set({ syncStatus: SyncGithubWorkflowStatus.syncedUsers })
        .where(eq(schema.githubIntegration.id, integrationId));
    });

    const updatedIntegration = await step.do(
      "get-updated-integration",
      async () => {
        return await db.query.githubIntegration.findFirst({
          where: eq(schema.githubIntegration.id, integrationId),
          with: { repositories: true, users: true },
        });
      },
    );
    if (!updatedIntegration) {
      throw new Error("Integration not found");
    }

    await step.do("sync-events", async () => {
      async function getPaginatedEvents(
        page: number,
        repo: typeof schema.githubRepository.$inferSelect,
      ) {
        const events = await octokit.rest.activity.listRepoEvents({
          owner: repo.owner,
          repo: repo.name,
          per_page: 100,
          page,
        });
        if (events.status !== 200) {
          throw new Error("Failed to fetch events");
        }
        return events.data;
      }

      await db
        .update(schema.githubIntegration)
        .set({ syncStatus: SyncGithubWorkflowStatus.syncingEvents })
        .where(eq(schema.githubIntegration.id, integrationId));

      const config = getConfig();

      for (const repo of updatedIntegration.repositories) {
        const events = await step.do(`fetch-events-${repo.name}`, async () => {
          let page = 1;
          let hasNextPage = true;
          const events = [];
          while (hasNextPage) {
            if (events.length >= config.maxEventsPerRepo) {
              hasNextPage = false;
              break;
            }

            const paginatedEvents = await getPaginatedEvents(page, repo);
            // const filteredEvents = paginatedEvents.filter(
            //   (event) =>
            //     event.created_at &&
            //     new Date(event.created_at) > config.oldestEventDate,
            // );
            const filteredEvents = paginatedEvents;
            if (filteredEvents.length === 0) {
              hasNextPage = false;
              break;
            }
            events.push(...filteredEvents);
            hasNextPage = filteredEvents.length >= 100;
            page++;
          }
          return events;
        });

        await step.do(`sync-events-${repo.name}`, async () => {
          const batchUpserts = events.map((event) => {
            return db
              .insert(schema.githubEvent)
              .values({
                id: nanoid(),
                githubId: event.id.toString(),
                insertedAt: new Date(),
                createdAt: event.created_at
                  ? new Date(event.created_at)
                  : new Date(),
                repositoryId: repo.id,
                type: event.type ?? "unknown",
                payload: event,
              })
              .onConflictDoUpdate({
                target: schema.githubEvent.githubId,
                setWhere: eq(schema.githubEvent.githubId, event.id.toString()),
                set: {
                  insertedAt: new Date(),
                  createdAt: event.created_at
                    ? new Date(event.created_at)
                    : new Date(),
                  repositoryId: repo.id,
                  type: event.type ?? "unknown",
                  payload: event,
                },
              });
          });
          await db.batch(batchUpserts as any);
        });
      }
    });

    await step.do("sync-events-update-integration-status", async () => {
      await db
        .update(schema.githubIntegration)
        .set({ syncStatus: SyncGithubWorkflowStatus.syncedEvents })
        .where(eq(schema.githubIntegration.id, integrationId));
    });

    await step.do("generating-embeddings", async () => {
      await db
        .update(schema.githubIntegration)
        .set({ syncStatus: SyncGithubWorkflowStatus.generatingEmbeddings })
        .where(eq(schema.githubIntegration.id, integrationId));

      const anthropicClient = new Anthropic({
        apiKey: this.env.ANTHROPIC_API_KEY,
      });
      const voyageClient = new VoyageAIClient({
        apiKey: this.env.VOYAGE_API_KEY,
      });

      const [eventsCount] = await db
        .select({ count: count() })
        .from(schema.githubEvent);
      console.log(`Found ${eventsCount?.count} events to process`);
      if (eventsCount?.count === 0) {
        return;
      }

      async function processEvent(
        env: HonoEnv["Bindings"],
        event: typeof schema.githubEvent.$inferSelect,
      ) {
        if (!event.payload) {
          return;
        }
        console.log(`Processing event ${event.id}, type: ${event.type}`);

        switch (event.type) {
          case "PushEvent": {
            await generatePushEventSummary(env, event);
            // const embeddings = (
            //   await Promise.allSettled(
            //     summaries.map((summary) =>
            //       generatePushEventEmbedding(env, summary),
            //     ),
            //   )
            // )
            //   .map((embedding) =>
            //     embedding.status === "fulfilled" ? embedding.value : null,
            //   )
            //   .filter(Boolean);

            // const githubEventVectors = embeddings.map((embedding, index) =>
            //   db.insert(schema.githubEventVector).values({
            //     id: nanoid(),
            //     eventId: event.id,
            //     embeddingText: summaries[index]!,
            //     embedding: sql`vector32(${JSON.stringify(embedding)})`,
            //   }),
            // );
            // console.log(`Inserting ${githubEventVectors.length} vectors`);

            // await db.batch(githubEventVectors as any);
            break;
          }
          default:
            break;
        }
      }

      async function generatePushEventSummary(
        env: HonoEnv["Bindings"],
        event: typeof schema.githubEvent.$inferSelect,
      ) {
        const textSplitter = new RecursiveCharacterTextSplitter({
          chunkSize: 30720,
          chunkOverlap: 100,
          separators: ["\n\n", "\n", " ", ""],
        });

        for (const commit of (event.payload as any).payload.commits) {
          const commitDetails = await octokit.request(
            "GET /repos/{owner}/{repo}/commits/{sha}",
            {
              owner: (event.payload as any).org.login,
              repo: (event.payload as any).repo.name.split("/")[1],
              sha: commit.sha,
            },
          );

          const batchSize = 1;

          for (
            let i = 0;
            i < Math.ceil(commitDetails.data.files.length / batchSize);
            i++
          ) {
            const files = commitDetails.data.files.slice(
              i * batchSize,
              (i + 1) * batchSize,
            );

            await Promise.all(
              files.map(async (file: any) => {
                const patchChunks =
                  (file.patch && file.patch?.length > 50000) ||
                  [
                    "LICENSE",
                    "bun.lockb",
                    "bun.lock",
                    "package.lock",
                    "yarn.lock",
                    "package-lock.json",
                    "pnpm-lock.yaml",
                  ].includes(file.filename) ||
                  file.filename.endsWith(".json")
                    ? ["[PATCH OMMITTED DUE TO FILE SIZE OR TYPE]"]
                    : await textSplitter.splitText(file.patch ?? "[NO PATCH]");

                console.log(
                  file.filename,
                  file.patch?.length,
                  patchChunks.length,
                );

                await Promise.all(
                  patchChunks.map(async (chunk) => {
                    const fileChanges = `file name: ${file.filename}
file status: ${file.status}
commit message: ${commit.message}
additions: ${file.additions}
deletions: ${file.deletions}
changes: ${file.changes}
patch: ${chunk}`;

                    const prompt = buildPushEventPrompt(
                      (event.payload as any).repo.name,
                      (event.payload as any).payload.ref,
                      fileChanges,
                    );

                    const summaryResponse =
                      await anthropicClient.messages.create({
                        model: "claude-3-5-haiku-20241022",
                        system: `You are an expert technical summarizer.
You are given a description of a git diff patch.
You are also given a description of the changes made in the commit and other metadata about the commit.
You are to write a concise summary of the changes made in the commit.
The summary should be no more than 200 words.
The summary should be self-contained and must correctly describe the changes made, focusing on the purpose and outcome of the changes.
The summary must be self-contained, infer the purpose and outcome of the changes from the information provided.
"patch" is the actual patch of the file change. It is a string of the changes made to the file. It is a git diff patch. It's a chunk of the file that was changed so it might not be a complete file.
"file status" is the status of the file in the git commit.
"additions" is the number of lines added in the git commit.
"deletions" is the number of lines deleted in the git commit.
"changes" is the number of lines changed in the git commit.

You MUST be helpful and concise. You MUST NOT hallucinate.`,
                        max_tokens: 8192,
                        messages: [{ role: "user", content: prompt }],
                      });

                    if (
                      !summaryResponse.content[0] ||
                      summaryResponse.content[0].type !== "text"
                    ) {
                      return [];
                    }

                    const summary = summaryResponse.content[0].text;

                    // if (
                    //   !("response" in summaryResponse) ||
                    //   !summaryResponse.response
                    // ) {
                    //   throw new Error("Failed to generate summary");
                    // }

                    const embeddingResponse = await voyageClient.embed({
                      input: summary,
                      model: "voyage-3-large",
                    });
                    console.log(embeddingResponse);

                    // const embeddingResponse: any = await env.AI.run(
                    //   "@cf/baai/bge-m3",
                    //   {
                    //     text: summary,
                    //     truncate_inputs: true,
                    //   },
                    // );

                    // if (
                    //   !embeddingResponse.data ||
                    //   !Array.isArray(embeddingResponse.data)
                    // ) {
                    //   throw new Error("Failed to generate embedding");
                    // }

                    const embedding = embeddingResponse.data?.[0]?.embedding;
                    if (!embedding) {
                      throw new Error("Failed to generate embedding");
                    }

                    await db.insert(schema.githubEventVector).values({
                      id: nanoid(),
                      eventId: event.id,
                      embeddingText: summary,
                      embedding: sql`vector32(${JSON.stringify(embedding)})`,
                      createdAt: new Date(),
                    });
                  }),
                );
                // for (const chunk of patchChunks) {

                // }
              }),
            );
          }
        }
      }

      // async function generatePushEventEmbedding(
      //   env: HonoEnv["Bindings"],
      //   summary: string,
      // ) {
      //   const embeddingResponse: any = await env.AI.run("@cf/baai/bge-m3", {
      //     text: summary,
      //     truncate_inputs: true,
      //   });

      //   if (!embeddingResponse.data || !Array.isArray(embeddingResponse.data)) {
      //     throw new Error("Failed to generate embedding");
      //   }

      //   return embeddingResponse.data[0];
      // }

      const batchSize = 20;
      for (let i = 0; i < Math.ceil(eventsCount!.count / batchSize); i++) {
        const events = await db.query.githubEvent.findMany({
          limit: batchSize,
          offset: i * batchSize,
          orderBy: [desc(schema.githubEvent.createdAt)],
        });
        await Promise.all(
          events.map(async (event) => {
            await step.do(`process-events-batch-${i}-${event.id}`, async () => {
              await processEvent(this.env, event);
            });
          }),
        );
      }

      await db
        .update(schema.githubIntegration)
        .set({ syncId: null, syncStatus: SyncGithubWorkflowStatus.completed })
        .where(eq(schema.githubIntegration.id, integrationId));
    });

    console.log("Completed");
  }
}

function buildPushEventPrompt(
  repoName: string,
  ref: string,
  changes: string,
): string {
  return `<metadata>
<repo>${repoName}</repo>
<ref>${ref}</ref>
</metadata>

<data>
${changes}
</data>`;
}
