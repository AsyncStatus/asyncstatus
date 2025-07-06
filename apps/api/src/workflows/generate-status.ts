import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { App, type Octokit } from "octokit";
import * as schema from "../db";
import { createDb } from "../db/db";
import type { HonoEnv } from "../lib/env";

export type GenerateStatusWorkflowParams = {
  jobId: string;
};

type FileInfo = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch: string | undefined;
};

function buildPushEventPrompt(
  repoName: string,
  branch: string,
  commitMessages: string[],
  stats: { files: number; additions: number; deletions: number },
  files: FileInfo[],
): string {
  const messagesXml = commitMessages
    .map((m) => `<message>${m}</message>`) // simplistic escaping
    .join("\n");

  const filesXml = files
    .map(
      (
        f,
      ) => `<file name="${f.filename}" status="${f.status}" additions="${f.additions}" deletions="${f.deletions}" changes="${f.changes}">
<patch>${(f.patch ?? "").slice(0, 5000)}</patch>
</file>`,
    )
    .join("\n");
  return `
<general>
You are an engineering assistant that writes concise daily stand-up bullets.
You provide a summary of the changes made to the repository, focusing on the purpose and outcome of the changes,
and avoiding file names. You MUST be helpful but concise. You MUST NOT hallucinate.
</general>

<data>
<repo>${repoName}</repo>
<branch>${branch}</branch>
<commitsCount>${commitMessages.length}</commitsCount>
<filesCount>${files.length}</filesCount>
<additions>${stats.additions}</additions>
<deletions>${stats.deletions}</deletions>
</data>

<commits>
${messagesXml}
</commits>

<files>
${filesXml}
</files>

Using the information above, write 1-4 concise stand-up bullet points (each starting with '- ').
Each bullet should highlight the inferred feature/section and the outcome of the work, avoiding file names.
Limit each bullet to 200 words.
Return ONLY the bullet list, no extra headings or prose.`;
}

/**
 * Build a prompt for Gemma to summarise a list of canonical GitHub event texts
 * into concise stand‑up bullets for the specified date range.
 */
function buildSummaryPrompt(
  events: string[],
  effectiveFrom: string | Date,
  effectiveTo: string | Date,
): string {
  const fromStr = new Date(effectiveFrom).toISOString();
  const toStr = new Date(effectiveTo).toISOString();
  const eventsXml = events
    .map((e) => `<event>${e}</event>`) // simplistic escaping
    .join("\n");

  return `
<general>
You are an engineering assistant that writes concise daily stand-up bullets.
Summarise the developer's GitHub activity between ${fromStr} and ${toStr} with a keen focus on OUTCOMES and user-facing impact.
Use commit messages and the nature of changed files to INFER which product feature, module, or section of the codebase was affected (e.g. "billing flow", "auth middleware", "mobile UI").
Avoid literal file names, but clearly mention the inferred feature/section when relevant.
Be helpful yet concise, and NEVER hallucinate. Generate UP TO 10 bullet points (fewer is better).
Make sure to condense the information to 100 words or less (less is better) and generally extract the most important information.
</general>

<stats>
<eventsCount>${events.length}</eventsCount>
</stats>

<events>
${eventsXml}
</events>

Using the information above, craft a list of 1-10 bullet points starting with '- '.
Return ONLY the bullet list, no extra headings or prose.`;
}

async function canonicalizeEvent(
  env: HonoEnv["Bindings"],
  octokit: Octokit,
  ghEvent: any,
): Promise<string> {
  // Very lightweight canonical text generator. Expand as needed.
  try {
    const { type, repo, payload } = ghEvent;
    const repoName = repo?.name ?? "unknown/repo";
    switch (type) {
      case "PushEvent": {
        // Summarize commits with Gemma model
        const commits = (payload?.commits ?? []) as any[];
        const commitMessages: string[] = commits.slice(0, 20).map((c: any) => `- ${c.message}`);

        const changedFiles: Set<string> = new Set();
        const fileInfos: FileInfo[] = [];
        let totalAdd = 0;
        let totalDel = 0;

        const [owner, repoShort] = repoName.split("/");

        const details = await Promise.allSettled(
          commits.slice(0, 20).map((c: any) =>
            octokit.request("GET /repos/{owner}/{repo}/commits/{sha}", {
              owner,
              repo: repoShort,
              sha: c.sha,
            }),
          ),
        );

        for (const res of details) {
          if (res.status !== "fulfilled") {
            console.warn("commit fetch failed", res.reason);
            continue;
          }
          const filesArr: any[] = res.value.data.files ?? [];
          filesArr.slice(0, 30).forEach((f) => {
            changedFiles.add(f.filename);
            totalAdd += f.additions ?? 0;
            totalDel += f.deletions ?? 0;

            if (fileInfos.length < 15) {
              fileInfos.push({
                filename: f.filename,
                status: f.status,
                additions: f.additions ?? 0,
                deletions: f.deletions ?? 0,
                changes: f.changes ?? 0,
                patch: f.patch,
              });
            }
          });
        }

        const ref = payload?.ref?.split("/").pop() ?? "main";
        const prompt = buildPushEventPrompt(
          repoName,
          ref,
          commitMessages,
          {
            files: changedFiles.size,
            additions: totalAdd,
            deletions: totalDel,
          },
          fileInfos,
        );
        const gemmaResp = await env.AI.run("@cf/meta/llama-4-scout-17b-16e-instruct", { prompt });
        let summaryText: string = Array.isArray(gemmaResp)
          ? gemmaResp.join("\n")
          : (((gemmaResp as any)?.response as string) ?? "");
        if (!summaryText.trim()) {
          summaryText = `pushed ${commits.length} commit${commits.length === 1 ? "" : "s"} to ${repoName}`;
        }
        const bulletsArr = summaryText
          .split("\n")
          .map((l: string) => l.trim())
          .filter(Boolean);
        return bulletsArr.join("\n");
      }
      case "PullRequestEvent": {
        const action = payload?.action ?? "updated";
        const pr = payload?.number;
        const title = payload?.pull_request?.title ?? "";
        return `${action} PR #${pr} \"${title}\" in ${repoName}`;
      }
      case "PullRequestReviewEvent": {
        const state = payload?.review?.state ?? "reviewed";
        const pr = payload?.pull_request?.number;
        const title = payload?.pull_request?.title ?? "";
        return `${state.toLowerCase()} PR #${pr} \"${title}\" in ${repoName}`;
      }
      case "IssuesEvent": {
        const action = payload?.action ?? "updated";
        const issue = payload?.issue?.number;
        const title = payload?.issue?.title ?? "";
        return `${action} issue #${issue} \"${title}\" in ${repoName}`;
      }
      case "CreateEvent": {
        const refType = payload?.ref_type;
        const refName = payload?.ref;
        if (refType === "repository") {
          return `created repository ${repoName}`;
        }
        return `created ${refType} ${refName} in ${repoName}`;
      }
      case "WatchEvent": {
        // action is usually "started"
        return `starred ${repoName}`;
      }
      default:
        return `${type} in ${repoName}`;
    }
  } catch (err) {
    console.error("canonicalizeEvent error", err);
    return "performed GitHub activity";
  }
}

export class GenerateStatusWorkflow extends WorkflowEntrypoint<
  HonoEnv["Bindings"],
  GenerateStatusWorkflowParams
> {
  async run(event: WorkflowEvent<GenerateStatusWorkflowParams>, step: WorkflowStep) {
    const { jobId } = event.payload;
    const db = createDb(this.env);

    // 1. Fetch job row
    const job = await step.do("get-job", async () => {
      const j = await db.query.statusGenerationJob.findFirst({
        where: eq(schema.statusGenerationJob.id, jobId),
        with: {
          member: {
            with: { organization: { with: { githubIntegration: true } } },
          },
        },
      });
      if (!j) throw new Error("Job not found");
      if (!j.member.organization.githubIntegration) {
        throw new Error("GitHub integration not found for organization");
      }
      return j;
    });
    // typescript is wrong here
    if (!job.member.organization.githubIntegration) {
      throw new Error("GitHub integration not found for organization");
    }
    if (!job.member.githubId) {
      throw new Error("GitHub user ID not found for member");
    }

    // 2. Mark running
    const now = new Date();
    await db
      .update(schema.statusGenerationJob)
      .set({ state: "running", startedAt: now })
      .where(eq(schema.statusGenerationJob.id, jobId));

    try {
      const app = new App({
        appId: this.env.GITHUB_APP_ID,
        privateKey: this.env.GITHUB_APP_PRIVATE_KEY,
      });
      const octokit = await app.getInstallationOctokit(
        Number(job.member.organization.githubIntegration.installationId),
      );
      // Find mapping in github_user table for this integration
      const githubUser = await db.query.githubUser.findFirst({
        where: and(
          eq(schema.githubUser.integrationId, job.member.organization.githubIntegration.id),
          eq(schema.githubUser.githubId, job.member.githubId),
        ),
      });
      if (!githubUser) {
        throw new Error("GitHub user record not found for this account and integration");
      }

      // 4. Fetch events between effectiveFrom & effectiveTo
      const events = await step.do("fetch-events", async () => {
        // naive pagination up to 5 pages
        const perPage = 100;
        let page = 1;
        const collected: any[] = [];
        const from = new Date(job.effectiveFrom);
        const to = new Date(job.effectiveTo);

        // First get repos accessible to installation
        const reposResp = await octokit.rest.apps.listReposAccessibleToInstallation();
        if (reposResp.status !== 200) {
          throw new Error("Failed to fetch repositories for installation");
        }

        const repos = reposResp.data.repositories;

        for (const repo of repos) {
          console.log(`Processing repo ${repo.name}`);
          page = 1;
          while (page <= 10) {
            const resp = await octokit.request("GET /repos/{owner}/{repo}/events", {
              owner: repo.owner.login,
              repo: repo.name,
              per_page: perPage,
              page,
            });

            if (resp.status !== 200) break;
            const batch = resp.data as any[];
            if (batch.length === 0) break;

            const userEvents = batch.filter(
              (ev) => ev.actor?.id?.toString() === githubUser.githubId,
            );
            const within = userEvents.filter((ev) => {
              const evDate = new Date(ev.created_at);
              return evDate >= from && evDate <= to;
            });
            collected.push(...within);

            const earliest = batch[batch.length - 1];
            if (earliest) {
              const earliestDate = new Date(earliest.created_at);
              if (earliestDate < from) break;
            }
            page += 1;
          }
        }

        console.log(`Fetched ${collected.length} events for user ${job.member.githubId}`);

        return collected;
      });

      // 5. Upsert events & vectors
      await step.do("store-events", async () => {
        for (const ev of events) {
          const existing = await db.query.githubEvent.findFirst({
            where: eq(schema.githubEvent.githubId, `${ev.id}`),
          });
          if (existing) continue; // already stored

          console.log(`Canonicalizing event ${ev.id}`);
          const canonical = await canonicalizeEvent(this.env, octokit, ev);
          console.log(`Canonicalized event ${ev.id}`);

          const newId = nanoid();
          await db.insert(schema.githubEvent).values({
            id: newId,
            githubId: `${ev.id}`,
            memberId: job.memberId,
            type: ev.type,
            repo: ev.repo?.name ?? "unknown/repo",
            createdAt: new Date(ev.created_at),
            canonicalText: canonical,
            payload: ev as any,
            insertedAt: new Date(),
          });

          // embedding
          console.log(`Generating embedding for ${canonical}`);
          const modelResponse: any = await (this.env.AI as any).run("@cf/baai/bge-m3", {
            text: canonical,
            truncate_inputs: true,
          });

          if (!modelResponse?.data || !Array.isArray(modelResponse.data)) {
            throw new Error("Invalid embedding data");
          }

          await db.insert(schema.githubEventVector).values({
            eventId: newId,
            embedding: sql`vector32(${JSON.stringify(modelResponse.data[0])})`,
          });
        }
      });

      // 6. Build summary list for status update
      const canonicalTexts = await db.query.githubEvent.findMany({
        columns: { canonicalText: true },
        where: and(
          eq(schema.githubEvent.memberId, job.memberId),
          gte(schema.githubEvent.createdAt, new Date(job.effectiveFrom)),
          lte(schema.githubEvent.createdAt, new Date(job.effectiveTo)),
        ),
        orderBy: asc(schema.githubEvent.createdAt),
      });

      // ===== Summarise canonical texts with Gemma =====
      const allEventLines = canonicalTexts.flatMap((row) =>
        (row.canonicalText ?? "")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
      );

      let summaryBullets: string[] = [];
      if (allEventLines.length > 0) {
        const summaryPrompt = buildSummaryPrompt(allEventLines, job.effectiveFrom, job.effectiveTo);
        const gemmaResp = await (this.env.AI as any).run(
          "@cf/meta/llama-4-scout-17b-16e-instruct",
          { prompt: summaryPrompt },
        );
        const summaryText: string = Array.isArray(gemmaResp)
          ? gemmaResp.join("\n")
          : (((gemmaResp as any)?.response as string) ?? "");
        summaryBullets = summaryText
          .split("\n")
          .map((l: string) => l.trim())
          .filter(Boolean);
        // Fallback to raw events if model produced nothing useful
        if (summaryBullets.length === 0) summaryBullets = allEventLines.slice(0, 10);
      }

      const statusUpdateId = nanoid();
      const now2 = new Date();
      await db.insert(schema.statusUpdate).values({
        id: statusUpdateId,
        memberId: job.memberId,
        organizationId: job.member.organizationId,
        teamId: null,
        effectiveFrom: new Date(job.effectiveFrom),
        effectiveTo: new Date(job.effectiveTo),
        mood: null,
        emoji: null,
        isDraft: false,
        createdAt: now2,
        updatedAt: now2,
      });

      const items = summaryBullets.map((bullet, idx) => ({
        id: nanoid(),
        statusUpdateId,
        content: bullet.replace(/^[-*]\s*/, ""),
        isBlocker: false,
        order: idx,
        createdAt: now2,
        updatedAt: now2,
      }));

      if (items.length > 0) {
        await db.insert(schema.statusUpdateItem).values(items);
      }

      // mark done
      await db
        .update(schema.statusGenerationJob)
        .set({ state: "done", statusUpdateId, finishedAt: new Date() })
        .where(eq(schema.statusGenerationJob.id, jobId));
    } catch (error: any) {
      console.error("generate-status workflow error", error);
      await db
        .update(schema.statusGenerationJob)
        .set({ state: "error", errorMessage: error.message ?? "unknown" })
        .where(eq(schema.statusGenerationJob.id, jobId));
      throw error;
    }
  }
}
