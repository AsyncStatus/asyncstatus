import * as schema from "@asyncstatus/db";
import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { and, desc, eq, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { TypedHandlersContext } from "../lib/env";
import { getCommitRange, getDateRange } from "../lib/filters";
import {
  getChangelogBySlugContract,
  listChangelogsByRepoContract,
  listReposByOwnerContract,
  startChangelogGenerationContract,
} from "./changelog-contracts";

export const listChangelogsByRepoHandler = typedHandler<
  TypedHandlersContext,
  typeof listChangelogsByRepoContract
>(listChangelogsByRepoContract, async ({ db, input }) => {
  if (!input.filters) {
    const whereChangelog = [eq(schema.changelog.repoOwner, input.owner)];
    const whereChangelogGenerationJob = [eq(schema.changelogGenerationJob.repoOwner, input.owner)];
    if (input.repo) {
      whereChangelog.push(eq(schema.changelog.repoName, input.repo));
      whereChangelogGenerationJob.push(eq(schema.changelogGenerationJob.repoName, input.repo));
    }
    const [changelogs, changelogGenerationJobs] = await Promise.all([
      db.query.changelog.findMany({
        where: and(...whereChangelog),
        orderBy: desc(schema.changelog.createdAt),
      }),
      db.query.changelogGenerationJob.findMany({
        where: and(...whereChangelogGenerationJob),
        orderBy: desc(schema.changelogGenerationJob.createdAt),
      }),
    ]);
    return { changelogs, changelogGenerationJobs };
  }

  const dateRange = getDateRange(input.filters);
  if (dateRange) {
    const whereChangelog = [
      eq(schema.changelog.repoOwner, input.owner),
      eq(schema.changelog.rangeStart, dateRange.start.toDate()),
      eq(schema.changelog.rangeEnd, dateRange.end.toDate()),
    ];
    const whereChangelogGenerationJob = [
      eq(schema.changelogGenerationJob.repoOwner, input.owner),
      eq(schema.changelogGenerationJob.rangeStart, dateRange.start.toDate()),
      eq(schema.changelogGenerationJob.rangeEnd, dateRange.end.toDate()),
    ];
    if (input.repo) {
      whereChangelog.push(eq(schema.changelog.repoName, input.repo));
      whereChangelogGenerationJob.push(eq(schema.changelogGenerationJob.repoName, input.repo));
    }
    const [changelogs, changelogGenerationJobs] = await Promise.all([
      db.query.changelog.findMany({
        where: and(...whereChangelog),
        orderBy: desc(schema.changelog.createdAt),
      }),
      db.query.changelogGenerationJob.findMany({
        where: and(...whereChangelogGenerationJob),
        orderBy: desc(schema.changelogGenerationJob.createdAt),
      }),
    ]);
    return { changelogs, changelogGenerationJobs };
  }

  const commitRange = getCommitRange(input.filters);
  if (commitRange) {
    const whereChangelog = [
      eq(schema.changelog.repoOwner, input.owner),
      eq(schema.changelog.fromCommitSha, commitRange.start),
      eq(schema.changelog.toCommitSha, commitRange.end),
    ];
    const whereChangelogGenerationJob = [
      eq(schema.changelogGenerationJob.repoOwner, input.owner),
      eq(schema.changelogGenerationJob.fromCommitSha, commitRange.start),
      eq(schema.changelogGenerationJob.toCommitSha, commitRange.end),
    ];
    if (input.repo) {
      whereChangelog.push(eq(schema.changelog.repoName, input.repo));
      whereChangelogGenerationJob.push(eq(schema.changelogGenerationJob.repoName, input.repo));
    }
    const [changelogs, changelogGenerationJobs] = await Promise.all([
      db.query.changelog.findMany({
        where: and(...whereChangelog),
        orderBy: desc(schema.changelog.createdAt),
      }),
      db.query.changelogGenerationJob.findMany({
        where: and(...whereChangelogGenerationJob),
        orderBy: desc(schema.changelogGenerationJob.createdAt),
      }),
    ]);
    return { changelogs, changelogGenerationJobs };
  }

  throw new TypedHandlersError({
    code: "BAD_REQUEST",
    message:
      "Invalid filters. Must be in the format of YYYY-MM-DD..YYYY-MM-DD or startCommitSha..endCommitSha",
  });
});

export const listReposByOwnerHandler = typedHandler<
  TypedHandlersContext,
  typeof listReposByOwnerContract
>(listReposByOwnerContract, async ({ db, input }) => {
  const repos = await db.query.changelogGithubRepository.findMany({
    where: eq(schema.changelogGithubRepository.repoOwner, input.owner),
  });
  return repos;
});

export const getChangelogBySlugHandler = typedHandler<
  TypedHandlersContext,
  typeof getChangelogBySlugContract
>(getChangelogBySlugContract, async ({ db, input }) => {
  const changelog = await db.query.changelog.findFirst({
    where: eq(schema.changelog.slug, input.slug),
  });
  if (!changelog) {
    throw new TypedHandlersError({
      code: "NOT_FOUND",
      message: "Changelog not found",
    });
  }
  return changelog;
});

export const startChangelogGenerationHandler = typedHandler<
  TypedHandlersContext,
  typeof startChangelogGenerationContract
>(startChangelogGenerationContract, async ({ db, input, workflow }) => {
  const existingJob = await db.query.changelogGenerationJob.findFirst({
    where: and(
      eq(schema.changelogGenerationJob.inputUrl, input.url.toString()),
      or(
        eq(schema.changelogGenerationJob.state, "queued"),
        eq(schema.changelogGenerationJob.state, "running"),
      ),
    ),
  });
  if (existingJob) {
    throw new TypedHandlersError({
      code: "BAD_REQUEST",
      message: "We are already generating a changelog for this URL.",
    });
  }

  const url = new URL(input.url);
  const [owner, repo] = url.pathname.split("/").slice(1);
  if (!owner || !repo) {
    throw new TypedHandlersError({
      code: "BAD_REQUEST",
      message: "Invalid GitHub URL. Must be in the format https://github.com/owner/repo.",
    });
  }
  const additionalValues: Record<string, Date | string> = {};
  const dateRange = getDateRange(input.filters);
  if (dateRange) {
    additionalValues.rangeStart = dateRange.start.toDate();
    additionalValues.rangeEnd = dateRange.end.toDate();
  }
  const commitRange = getCommitRange(input.filters);
  if (commitRange) {
    additionalValues.fromCommitSha = commitRange.start;
    additionalValues.toCommitSha = commitRange.end;
  }

  const [changelogGenerationJob] = await db
    .insert(schema.changelogGenerationJob)
    .values({
      ...additionalValues,
      id: nanoid(),
      inputUrl: input.url.toString(),
      repoOwner: owner,
      repoName: repo,
      state: "queued",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  if (!changelogGenerationJob) {
    throw new TypedHandlersError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create changelog generation job",
    });
  }
  await workflow.changelogGenerationJob.create({
    params: { jobId: changelogGenerationJob.id },
  });

  return changelogGenerationJob;
});
