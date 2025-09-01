import type { Endpoints } from "@octokit/types";
import { tool } from "ai";
import type { Octokit } from "octokit";
import { z } from "zod";

export function listGithubCommitsTool(octokit: Octokit) {
  return tool({
    description: "List commits for a repo with optional since/until/headSha filters.",
    parameters: z.object({
      owner: z.string(),
      repo: z.string(),
      since: z.string().optional(),
      until: z.string().optional(),
      headSha: z.string().optional(),
      perPage: z.number().optional().default(100),
      maxPages: z.number().optional().default(10),
    }),
    execute: async (params) => {
      type ListParams = Endpoints["GET /repos/{owner}/{repo}/commits"]["parameters"];
      type ListItem = Endpoints["GET /repos/{owner}/{repo}/commits"]["response"]["data"][number];

      const baseParams: ListParams = {
        owner: params.owner,
        repo: params.repo,
        per_page: params.perPage ?? 100,
        ...(params.since ? { since: new Date(params.since).toISOString() } : {}),
        ...(params.until ? { until: new Date(params.until).toISOString() } : {}),
        ...(params.headSha ? { sha: params.headSha } : {}),
      } as unknown as ListParams;

      const results: ListItem[] = [];
      let pageCount = 0;
      for await (const page of octokit.paginate.iterator(
        "GET /repos/{owner}/{repo}/commits",
        baseParams,
      )) {
        const data = page.data as ListItem[];
        results.push(...data);
        pageCount += 1;
        if (pageCount >= (params.maxPages ?? 10)) break;
      }
      return results;
    },
  });
}
