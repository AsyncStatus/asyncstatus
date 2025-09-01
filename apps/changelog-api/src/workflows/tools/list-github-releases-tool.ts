import type { Endpoints } from "@octokit/types";
import { tool } from "ai";
import type { Octokit } from "octokit";
import { z } from "zod";

export function listGithubReleasesTool(octokit: Octokit) {
  return tool({
    description: "List releases for a repository.",
    parameters: z.object({
      owner: z.string(),
      repo: z.string(),
      perPage: z.number().optional().default(100),
      maxPages: z.number().optional().default(10),
    }),
    execute: async (params) => {
      type ListParams = Endpoints["GET /repos/{owner}/{repo}/releases"]["parameters"];
      type ListItem = Endpoints["GET /repos/{owner}/{repo}/releases"]["response"]["data"][number];
      const baseParams: ListParams = {
        owner: params.owner,
        repo: params.repo,
        per_page: params.perPage ?? 100,
      } as unknown as ListParams;
      const results: ListItem[] = [];
      let pageCount = 0;
      for await (const page of octokit.paginate.iterator(
        "GET /repos/{owner}/{repo}/releases",
        baseParams,
      )) {
        results.push(...(page.data as ListItem[]));
        pageCount += 1;
        if (pageCount >= (params.maxPages ?? 10)) break;
      }
      return results;
    },
  });
}
