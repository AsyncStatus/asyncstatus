import { tool } from "ai";
import type { Octokit } from "octokit";
import { z } from "zod";

export function getGithubFileTool(octokit: Octokit) {
  return tool({
    description:
      "Get raw file content from a repository at a specific path and optional ref (branch/commit).",
    parameters: z.object({
      owner: z.string(),
      repo: z.string(),
      path: z.string(),
      ref: z.string().optional(),
    }),
    execute: async (params) => {
      const res = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
        owner: params.owner,
        repo: params.repo,
        path: params.path,
        ref: params.ref,
        headers: { accept: "application/vnd.github.v3.raw" },
      });
      // Octokit returns the raw content as data when using raw accept header
      return typeof res.data === "string" ? res.data : JSON.stringify(res.data);
    },
  });
}
