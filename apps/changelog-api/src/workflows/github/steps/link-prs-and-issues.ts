import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { and, eq } from "drizzle-orm";
import { isTuple } from "../../../lib/is-tuple";

type LinkPrsAndIssuesParams = {
  db: Db;
  owner: string;
  repo: string;
};

const CLOSING_KEYWORD_REGEX =
  /(close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+((?:([\w-]+)\/([\w.-]+))?#(\d+))/gi;

export async function linkPrsAndIssues({ db, owner, repo }: LinkPrsAndIssuesParams) {
  // Load PR events
  const prEvents = await db
    .select({
      id: schema.changelogGithubEvent.id,
      prNumber: schema.changelogGithubEvent.prNumber,
      payload: schema.changelogGithubEvent.payload,
    })
    .from(schema.changelogGithubEvent)
    .where(
      and(
        eq(schema.changelogGithubEvent.repoOwner, owner),
        eq(schema.changelogGithubEvent.repoName, repo),
        eq(schema.changelogGithubEvent.sourceType, "pull_request"),
      ),
    );

  // Load issue events
  const issueEvents = await db
    .select({
      id: schema.changelogGithubEvent.id,
      issueNumber: schema.changelogGithubEvent.issueNumber,
      payload: schema.changelogGithubEvent.payload,
    })
    .from(schema.changelogGithubEvent)
    .where(
      and(
        eq(schema.changelogGithubEvent.repoOwner, owner),
        eq(schema.changelogGithubEvent.repoName, repo),
        eq(schema.changelogGithubEvent.sourceType, "issue"),
      ),
    );

  const issueNumberToEvent = new Map<number, { id: string; payload: unknown }>();
  for (const it of issueEvents) {
    if (typeof it.issueNumber === "number") {
      issueNumberToEvent.set(it.issueNumber, { id: it.id, payload: it.payload });
    }
  }

  const updates = [];
  const now = new Date();

  for (const pr of prEvents) {
    const payload = pr.payload as { body: string; title: string };
    const body = payload && typeof payload.body === "string" ? payload.body : "";
    const title = payload && typeof payload.title === "string" ? payload.title : "";
    const text = `${title}\n${body}`;

    const linkedIssueNumbers = new Set<number>();
    for (const match of text.matchAll(CLOSING_KEYWORD_REGEX)) {
      const ownerFromRef = match[3];
      const repoFromRef = match[4];
      const numStr = match[5];
      const num = Number(numStr);
      if (!Number.isFinite(num)) continue;
      // Keep same-repo links only, if repo owner/name is specified ensure it matches
      if (ownerFromRef && repoFromRef) {
        if (ownerFromRef !== owner || repoFromRef !== repo) continue;
      }
      linkedIssueNumbers.add(num);
    }

    if (linkedIssueNumbers.size === 0) {
      continue;
    }

    // Update PR payload with linkedIssueNumbers
    const updatedPrPayload = {
      ...payload,
      linkedIssueNumbers: Array.from(linkedIssueNumbers).sort((a, b) => a - b),
    };
    updates.push(
      db
        .update(schema.changelogGithubEvent)
        .set({ payload: updatedPrPayload, lastSeenAt: now })
        .where(eq(schema.changelogGithubEvent.id, pr.id)),
    );

    // Update each linked issue payload with reverse linkage
    for (const issueNumber of linkedIssueNumbers) {
      const issueEvent = issueNumberToEvent.get(issueNumber);
      if (!issueEvent) continue;
      const issuePayload = issueEvent.payload as { linkedPrNumbers: number[] };
      const existing =
        issuePayload && Array.isArray(issuePayload.linkedPrNumbers)
          ? (issuePayload.linkedPrNumbers as unknown[]).filter(
              (n): n is number => typeof n === "number",
            )
          : [];
      const nextSet = new Set<number>(existing);
      if (typeof pr.prNumber === "number") nextSet.add(pr.prNumber);
      const updatedIssuePayload = {
        ...(issuePayload ?? {}),
        linkedPrNumbers: Array.from(nextSet).sort((a, b) => a - b),
      };
      updates.push(
        db
          .update(schema.changelogGithubEvent)
          .set({ payload: updatedIssuePayload, lastSeenAt: now })
          .where(eq(schema.changelogGithubEvent.id, issueEvent.id)),
      );
    }
  }

  if (isTuple(updates)) {
    await db.batch(updates);
  }
}
