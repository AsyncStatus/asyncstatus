import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import * as schema from "@asyncstatus/db";
import { createDb } from "@asyncstatus/db/create-db";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { Octokit } from "octokit";
import type { HonoEnv } from "../../lib/env";
import { generateChangelogContent } from "../changelogs/generate-changelog-content";
import { createReportStatusFn } from "./steps/common";
import { fetchAndSyncCommits } from "./steps/fetch-and-sync-commits";
import { fetchAndSyncContributors } from "./steps/fetch-and-sync-contributors";
import { fetchAndSyncIssues } from "./steps/fetch-and-sync-issues";
import { fetchAndSyncPullRequests } from "./steps/fetch-and-sync-pull-requests";
import { fetchAndSyncReleases } from "./steps/fetch-and-sync-releases";
import { fetchAndSyncRepositories } from "./steps/fetch-and-sync-repositories";
import { fetchAndSyncTags } from "./steps/fetch-and-sync-tags";
import { linkPrsAndIssues } from "./steps/link-prs-and-issues";

export type ChangelogGenerationJobWorkflowParams = {
  jobId: string;
};

export class ChangelogGenerationJobWorkflow extends WorkflowEntrypoint<
  HonoEnv["Bindings"],
  ChangelogGenerationJobWorkflowParams
> {
  async run(event: WorkflowEvent<ChangelogGenerationJobWorkflowParams>, step: WorkflowStep) {
    const { jobId } = event.payload;
    const db = createDb(this.env);
    const job = await db.query.changelogGenerationJob.findFirst({
      where: and(
        eq(schema.changelogGenerationJob.id, jobId),
        eq(schema.changelogGenerationJob.state, "queued"),
      ),
    });
    if (!job) {
      throw new Error("Changelog generation job not found");
    }

    const basicAuth = btoa(`${this.env.GITHUB_CLIENT_ID}:${this.env.GITHUB_CLIENT_SECRET}`);
    const AuthenticatedOctokit = Octokit.defaults({
      request: { headers: { authorization: `Basic ${basicAuth}` } },
    });

    const owner = job.repoOwner;
    const repo = job.repoName;
    const since = job.rangeStart ?? undefined;
    const until = job.rangeEnd ?? undefined;
    const headSha = job.toCommitSha ?? undefined;

    await step.do("start-job", async () => {
      const db = createDb(this.env);
      await db
        .update(schema.changelogGenerationJob)
        .set({ state: "running", startedAt: new Date(), updatedAt: new Date() })
        .where(eq(schema.changelogGenerationJob.id, jobId));
    });

    await step.do(
      "sync-repositories",
      { retries: { limit: 3, delay: 30, backoff: "exponential" }, timeout: 30000 },
      async () => {
        const db = createDb(this.env);
        const octokit = new AuthenticatedOctokit();
        const report = createReportStatusFn({
          db,
          jobId,
          status: "Syncing repositories",
          statusOnError: "Failed to sync repositories",
          canSkip: true,
        });
        await report(() => fetchAndSyncRepositories({ octokit, db, owner }));
      },
    );

    await step.do(
      "sync-contributors",
      { retries: { limit: 3, delay: 30, backoff: "exponential" }, timeout: 30000 },
      async () => {
        const db = createDb(this.env);
        const octokit = new AuthenticatedOctokit();

        const report = createReportStatusFn({
          db,
          jobId,
          status: "Syncing contributors",
          statusOnError: "Failed to sync contributors",
          canSkip: true,
        });
        await report(() => fetchAndSyncContributors({ octokit, db, owner, repo }));
      },
    );

    await step.do(
      "sync-commits",
      { retries: { limit: 3, delay: 30, backoff: "exponential" }, timeout: 30000 },
      async () => {
        const db = createDb(this.env);
        const octokit = new AuthenticatedOctokit();
        const report = createReportStatusFn({
          db,
          jobId,
          status: "Syncing commits",
          statusOnError: "Failed to sync commits",
          canSkip: true,
        });
        await report(() =>
          fetchAndSyncCommits({ octokit, db, owner, repo, since, until, headSha }),
        );
      },
    );

    await step.do(
      "sync-tags",
      { retries: { limit: 3, delay: 30, backoff: "exponential" }, timeout: 30000 },
      async () => {
        const db = createDb(this.env);
        const octokit = new AuthenticatedOctokit();
        const report = createReportStatusFn({
          db,
          jobId,
          status: "Syncing tags",
          statusOnError: "Failed to sync tags",
          canSkip: true,
        });
        await report(() => fetchAndSyncTags({ octokit, db, owner, repo }));
      },
    );

    await step.do(
      "sync-releases",
      { retries: { limit: 3, delay: 30, backoff: "exponential" }, timeout: 30000 },
      async () => {
        const db = createDb(this.env);
        const octokit = new AuthenticatedOctokit();
        const report = createReportStatusFn({
          db,
          jobId,
          status: "Syncing releases",
          statusOnError: "Failed to sync releases",
          canSkip: true,
        });
        await report(() => fetchAndSyncReleases({ octokit, db, owner, repo }));
      },
    );

    await step.do(
      "sync-pull-requests",
      { retries: { limit: 3, delay: 30, backoff: "exponential" }, timeout: 30000 },
      async () => {
        const db = createDb(this.env);
        const octokit = new AuthenticatedOctokit();
        const report = createReportStatusFn({
          db,
          jobId,
          status: "Syncing pull requests",
          statusOnError: "Failed to sync pull requests",
          canSkip: true,
        });
        await report(() => fetchAndSyncPullRequests({ octokit, db, owner, repo, since }));
      },
    );

    await step.do(
      "sync-issues",
      { retries: { limit: 3, delay: 30, backoff: "exponential" }, timeout: 30000 },
      async () => {
        const db = createDb(this.env);
        const octokit = new AuthenticatedOctokit();
        const report = createReportStatusFn({
          db,
          jobId,
          status: "Syncing issues",
          statusOnError: "Failed to sync issues",
          canSkip: true,
        });
        await report(() => fetchAndSyncIssues({ octokit, db, owner, repo, since }));
      },
    );

    await step.do(
      "link-prs-issues",
      { retries: { limit: 3, delay: 30, backoff: "exponential" }, timeout: 30000 },
      async () => {
        const db = createDb(this.env);
        const report = createReportStatusFn({
          db,
          jobId,
          status: "Linking PRs and issues",
          statusOnError: "Failed to link PRs and issues",
          canSkip: true,
        });
        await report(() => linkPrsAndIssues({ db, owner, repo }));
      },
    );

    await step.do(
      "generate-changelog",
      { retries: { limit: 3, delay: 30, backoff: "exponential" }, timeout: 30000 },
      async () => {
        const db = createDb(this.env);
        const openRouterProvider = createOpenRouter({ apiKey: this.env.OPENROUTER_API_KEY });
        const octokit = new AuthenticatedOctokit();
        const report = createReportStatusFn({
          db,
          jobId,
          status: "Generating changelog",
          statusOnError: "Failed to generate changelog",
          canSkip: false,
        });
        await report(async () => {
          const changelogContent = await generateChangelogContent({
            db,
            owner,
            repo,
            fromCommitSha: job.fromCommitSha ?? undefined,
            toCommitSha: job.toCommitSha ?? undefined,
            rangeStart: job.rangeStart?.toISOString() ?? undefined,
            rangeEnd: job.rangeEnd?.toISOString() ?? undefined,
            model: "openai/gpt-5-mini",
            octokit,
            openRouterProvider,
          });

          const [changelog] = await db
            .insert(schema.changelog)
            .values({
              id: nanoid(),
              slug: nanoid(8),
              repoOwner: owner,
              repoName: repo,
              repoFullName: `${owner}/${repo}`,
              repoUrl: `https://github.com/${owner}/${repo}`,
              content: changelogContent,
              fromCommitSha: job.fromCommitSha ?? null,
              toCommitSha: job.toCommitSha ?? null,
              rangeStart: job.rangeStart ?? null,
              rangeEnd: job.rangeEnd ?? null,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();
          if (!changelog) {
            throw new Error("Failed to create changelog");
          }

          await db
            .update(schema.changelogGenerationJob)
            .set({ changelogId: changelog.id })
            .where(eq(schema.changelogGenerationJob.id, jobId));
        });
      },
    );

    await step.do(
      "finish-job",
      { retries: { limit: 3, delay: 30, backoff: "exponential" }, timeout: 30000 },
      async () => {
        const db = createDb(this.env);
        await db
          .update(schema.changelogGenerationJob)
          .set({
            state: "done",
            metadata: { humanReadableStatus: "Finished" },
            finishedAt: new Date(),
            updatedAt: new Date(),
            errorMessage: null,
            errorAt: null,
          })
          .where(eq(schema.changelogGenerationJob.id, jobId));
      },
    );
  }
}
