import type { Endpoints } from "@octokit/types";
import { tool } from "ai";
import type { Octokit } from "octokit";
import { z } from "zod";

type CommitResponse = Endpoints["GET /repos/{owner}/{repo}/commits/{ref}"]["response"]["data"];
type CommitFile = NonNullable<CommitResponse["files"]>[number];

export function getGithubCommitChangesTool(octokit: Octokit) {
  return tool({
    description:
      "Fetch commit changes (files, stats, per-file unified patch) with optional raw diff. Supports filtering by filename or filesRegex, grepRegex with contextBefore/contextAfter, line-range slicing via linesStart/linesEnd, and maxBytes truncation. Returns { sha, htmlUrl, author, committer, message, stats, files[{ filename, status, additions, deletions, changes, previousFilename, patch }], rawDiff? }.",
    parameters: z.object({
      owner: z.string(),
      repo: z.string(),
      sha: z.string().describe("The commit SHA"),
      includeRawDiff: z.boolean().optional().default(false),
      filename: z
        .string()
        .optional()
        .describe("Only return changes for this exact file path (repo-relative)."),
      filesRegex: z
        .string()
        .optional()
        .describe("JS-style regex string to include matching file paths (e.g., \\.(ts|tsx)$)."),
      grepRegex: z
        .string()
        .optional()
        .describe(
          "JS-style regex string to filter patch lines. Only matching lines will be returned, with optional context.",
        ),
      contextBefore: z
        .number()
        .optional()
        .default(2)
        .describe("Lines of context before grep matches."),
      contextAfter: z
        .number()
        .optional()
        .default(2)
        .describe("Lines of context after grep matches."),
      linesStart: z
        .number()
        .optional()
        .describe("Start line (1-based) of the patch slice to return for each file."),
      linesEnd: z
        .number()
        .optional()
        .describe("End line (inclusive, 1-based) of the patch slice to return for each file."),
      maxBytes: z
        .number()
        .optional()
        .describe("If provided, truncate returned patch/rawDiff to approximately this many bytes."),
    }),
    execute: async ({
      owner,
      repo,
      sha,
      includeRawDiff,
      filename,
      filesRegex,
      grepRegex,
      contextBefore = 2,
      contextAfter = 2,
      linesStart,
      linesEnd,
      maxBytes,
    }) => {
      const res = await octokit.request("GET /repos/{owner}/{repo}/commits/{ref}", {
        owner,
        repo,
        ref: sha,
      });

      const data = res.data as CommitResponse;
      type CommitFileExtra = CommitFile & {
        previous_filename?: string;
        patch?: string;
        blob_url?: string;
        raw_url?: string;
      };
      // Filter files by name/regex if requested
      const fileRegex = typeof filesRegex === "string" ? new RegExp(filesRegex) : null;
      const files = (data.files ?? [])
        .filter((f) => (filename ? f.filename === filename : true))
        .filter((f) => (fileRegex ? fileRegex.test(f.filename) : true))
        .map((f: CommitFile) => {
          const cf = f as CommitFileExtra;

          // Work on a local patch string for this file
          let patchText: string | null = cf.patch ?? null;

          // Slice by lines range if requested
          if (patchText && (linesStart || linesEnd)) {
            const lines = patchText.split("\n");
            const start = Math.max(1, linesStart ?? 1) - 1; // to 0-based index
            const end = Math.min(lines.length, linesEnd ?? lines.length); // inclusive (1-based)
            patchText = lines.slice(start, end).join("\n");
          }

          // Grep filter if requested
          if (patchText && typeof grepRegex === "string") {
            const regex = new RegExp(grepRegex as string);
            const lines = patchText.split("\n");
            const keep: boolean[] = new Array(lines.length).fill(false);
            for (let i = 0; i < lines.length; i += 1) {
              const line = lines[i] ?? "";
              if (regex.test(line)) {
                const from = Math.max(0, i - contextBefore);
                const to = Math.min(lines.length - 1, i + contextAfter);
                for (let j = from; j <= to; j += 1) keep[j] = true;
              }
            }
            const filtered: string[] = [];
            for (let i = 0; i < lines.length; i += 1) {
              if (keep[i]) {
                const line = lines[i];
                if (line !== undefined) filtered.push(line);
              }
            }
            patchText = filtered.join("\n");
          }

          // Truncate per-file patch to maxBytes if specified
          if (patchText && typeof maxBytes === "number" && maxBytes > 0) {
            if (patchText.length > maxBytes) {
              patchText = patchText.slice(0, maxBytes);
            }
          }

          return {
            filename: f.filename,
            status: f.status,
            additions: f.additions,
            deletions: f.deletions,
            changes: f.changes,
            previousFilename: cf.previous_filename ?? null,
            patch: patchText,
            blobUrl: cf.blob_url ?? null,
            rawUrl: cf.raw_url ?? null,
          };
        });

      let rawDiff: string | null = null;
      if (includeRawDiff) {
        const diffRes = await octokit.request("GET /repos/{owner}/{repo}/commits/{ref}", {
          owner,
          repo,
          ref: sha,
          headers: { accept: "application/vnd.github.v3.diff" },
        });
        rawDiff = typeof diffRes.data === "string" ? diffRes.data : JSON.stringify(diffRes.data);
        // Apply optional grep/slice/limit to raw diff as well
        if (rawDiff && (linesStart || linesEnd)) {
          const lines = rawDiff.split("\n");
          const start = Math.max(1, linesStart ?? 1) - 1;
          const end = Math.min(lines.length, linesEnd ?? lines.length);
          rawDiff = lines.slice(start, end).join("\n");
        }
        if (rawDiff && typeof grepRegex === "string") {
          const regex = new RegExp(grepRegex as string);
          const lines = rawDiff.split("\n");
          const keep: boolean[] = new Array(lines.length).fill(false);
          for (let i = 0; i < lines.length; i += 1) {
            const line = lines[i] ?? "";
            if (regex.test(line)) {
              const from = Math.max(0, i - contextBefore);
              const to = Math.min(lines.length - 1, i + contextAfter);
              for (let j = from; j <= to; j += 1) keep[j] = true;
            }
          }
          const filtered: string[] = [];
          for (let i = 0; i < lines.length; i += 1) {
            if (keep[i]) {
              const line = lines[i];
              if (line !== undefined) filtered.push(line);
            }
          }
          rawDiff = filtered.join("\n");
        }
        if (rawDiff && typeof maxBytes === "number" && maxBytes > 0 && rawDiff.length > maxBytes) {
          rawDiff = rawDiff.slice(0, maxBytes);
        }
      }

      return {
        sha: data.sha,
        htmlUrl: data.html_url,
        author: data.commit?.author ?? null,
        committer: data.commit?.committer ?? null,
        message: data.commit?.message ?? null,
        stats: data.stats ?? null,
        files,
        rawDiff: includeRawDiff ? rawDiff : undefined,
      };
    },
  });
}
