import { tool } from "ai";
import type { Octokit } from "octokit";
import { z } from "zod";

export function compareGithubCommitsTool(octokit: Octokit) {
  return tool({
    description: "Compare two commits and return the diff stats and files changed.",
    parameters: z.object({
      owner: z.string(),
      repo: z.string(),
      base: z.string(),
      head: z.string(),
    }),
    execute: async (params) => {
      const res = await octokit.request("GET /repos/{owner}/{repo}/compare/{base}...{head}", {
        owner: params.owner,
        repo: params.repo,
        base: params.base,
        head: params.head,
      });
      return res.data;
    },
  });
}
