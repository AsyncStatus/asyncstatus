import type { Db } from "@asyncstatus/db/create-db";
import type { OpenRouterProvider } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import type { Octokit } from "octokit";
import { compareGithubCommitsTool } from "../tools/compare-github-commits-tool";
import { getChangelogContributorTool } from "../tools/get-changelog-contributor-tool";
import { getChangelogEventDetailTool } from "../tools/get-changelog-event-detail-tool";
import { getChangelogJobTool } from "../tools/get-changelog-job-tool";
import { getGithubCommitChangesTool } from "../tools/get-github-commit-changes-tool";
import { getGithubFileTool } from "../tools/get-github-file-tool";
import { listChangelogEventsTool } from "../tools/list-changelog-events-tool";
import { listGithubCommitsTool } from "../tools/list-github-commits-tool";
import { listGithubIssuesTool } from "../tools/list-github-issues-tool";
import { listGithubPullRequestsTool } from "../tools/list-github-pull-requests-tool";
import { listGithubReleasesTool } from "../tools/list-github-releases-tool";
import { listGithubTagsTool } from "../tools/list-github-tags-tool";
import { systemPrompt } from "./system-prompt";

export type GenerateChangelogContentOptions = {
  db: Db;
  openRouterProvider: OpenRouterProvider;
  owner: string;
  repo: string;
  octokit: Octokit;
  fromCommitSha?: string;
  toCommitSha?: string;
  rangeStart?: string;
  rangeEnd?: string;
  model?: string;
};

export async function generateChangelogContent({
  openRouterProvider,
  owner,
  repo,
  fromCommitSha,
  toCommitSha,
  rangeStart,
  rangeEnd,
  model = "openai/gpt-5-mini",
  octokit,
  db,
}: GenerateChangelogContentOptions) {
  const messages = [
    {
      role: "user" as const,
      content: `Generate a high-quality release changelog for repo ${owner}/${repo}.
Input constraints: commit range ${fromCommitSha ?? "(none)"}..${toCommitSha ?? "(none)"}, date range ${rangeStart ?? "(none)"}..${rangeEnd ?? "(none)"}.
Use provided tools to fetch events (commits, PRs, issues, tags, releases), compare commits, read file contents if needed, and include contributors.
Organize by categories (Features, Fixes, Chore/Refactor, Docs, Breaking Changes), include PR/Issue references when available, and keep it concise and readable.
Return Markdown content only.`,
    },
  ];

  const { text } = await generateText({
    model: openRouterProvider(model),
    maxSteps: 120,
    system: systemPrompt,
    messages,
    toolChoice: "auto",
    tools: {
      listGithubCommits: listGithubCommitsTool(octokit),
      listGithubPullRequests: listGithubPullRequestsTool(octokit),
      listGithubIssues: listGithubIssuesTool(octokit),
      listGithubTags: listGithubTagsTool(octokit),
      listGithubReleases: listGithubReleasesTool(octokit),
      compareGithubCommits: compareGithubCommitsTool(octokit),
      getGithubCommitChanges: getGithubCommitChangesTool(octokit),
      getGithubFile: getGithubFileTool(octokit),
      getChangelogJob: getChangelogJobTool(db),
      listChangelogEvents: listChangelogEventsTool(db),
      getChangelogEventDetail: getChangelogEventDetailTool(db),
      getChangelogContributor: getChangelogContributorTool(db),
    },
  });

  return text;
}
