import type { Endpoints } from "@octokit/types";
import { tool } from "ai";
import type { Octokit } from "octokit";
import { z } from "zod";

export function listGithubPullRequestsTool(octokit: Octokit) {
  return tool({
    description: "List pull requests for a repo with optional since (merged/updated) filter.",
    parameters: z.object({
      owner: z.string(),
      repo: z.string(),
      state: z.enum(["open", "closed", "all"]).optional().default("all"),
      since: z.string().optional(),
      perPage: z.number().optional().default(100),
      maxPages: z.number().optional().default(10),
    }),
    execute: async (params) => {
      type ListParams = Endpoints["GET /repos/{owner}/{repo}/pulls"]["parameters"];
      type ListItem = Endpoints["GET /repos/{owner}/{repo}/pulls"]["response"]["data"][number];

      const baseParams: ListParams = {
        owner: params.owner,
        repo: params.repo,
        per_page: params.perPage ?? 100,
        state: params.state ?? "all",
        sort: "updated",
        direction: "desc",
      } as unknown as ListParams;

      const results: ListItem[] = [];
      let pageCount = 0;
      for await (const page of octokit.paginate.iterator(
        "GET /repos/{owner}/{repo}/pulls",
        baseParams,
      )) {
        const pageData = page.data as ListItem[];
        const data = params.since
          ? pageData.filter((pr) => {
              const mergedAt = pr.merged_at ? new Date(pr.merged_at) : undefined;
              const updatedAt = pr.updated_at ? new Date(pr.updated_at) : undefined;
              const createdAt = pr.created_at ? new Date(pr.created_at) : undefined;
              const candidate = mergedAt ?? updatedAt ?? createdAt ?? new Date(0);
              return candidate >= new Date(params.since as string);
            })
          : pageData;
        results.push(...data);
        pageCount += 1;
        if (pageCount >= (params.maxPages ?? 10)) break;
      }
      return results;
    },
  });
}
