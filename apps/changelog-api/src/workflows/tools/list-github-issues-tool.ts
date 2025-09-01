import type { Endpoints } from "@octokit/types";
import { tool } from "ai";
import type { Octokit } from "octokit";
import { z } from "zod";

export function listGithubIssuesTool(octokit: Octokit) {
  return tool({
    description: "List issues for a repo with optional since (closed/updated) filter.",
    parameters: z.object({
      owner: z.string(),
      repo: z.string(),
      state: z.enum(["open", "closed", "all"]).optional().default("all"),
      since: z.string().optional(),
      perPage: z.number().optional().default(100),
      maxPages: z.number().optional().default(10),
    }),
    execute: async (params) => {
      type ListParams = Endpoints["GET /repos/{owner}/{repo}/issues"]["parameters"];
      type ListItem = Endpoints["GET /repos/{owner}/{repo}/issues"]["response"]["data"][number];

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
        "GET /repos/{owner}/{repo}/issues",
        baseParams,
      )) {
        const pageData = page.data as ListItem[];
        const data = pageData
          .filter((it) => !("pull_request" in (it as unknown as Record<string, unknown>)))
          .filter((it) => {
            if (!params.since) return true;
            const closedAt = it.closed_at ? new Date(it.closed_at) : undefined;
            const updatedAt = it.updated_at ? new Date(it.updated_at) : undefined;
            const createdAt = it.created_at ? new Date(it.created_at) : undefined;
            const candidate = closedAt ?? updatedAt ?? createdAt ?? new Date(0);
            return candidate >= new Date(params.since as string);
          });
        results.push(...data);
        pageCount += 1;
        if (pageCount >= (params.maxPages ?? 10)) break;
      }
      return results;
    },
  });
}
