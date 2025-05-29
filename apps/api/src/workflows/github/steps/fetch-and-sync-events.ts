import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { Octokit } from "octokit";

import type { Db } from "../../../db";
import * as schema from "../../../db/schema";
import { isTuple } from "./common";

type FetchAndSyncEventsParams = {
  octokit: Octokit;
  db: Db;
  integrationId: string;
  maxEventDate: Date;
};

export async function fetchAndSyncEvents({
  octokit,
  db,
  integrationId,
  maxEventDate,
}: FetchAndSyncEventsParams) {
  const repositories = await db.query.githubRepository.findMany({
    where: eq(schema.githubRepository.integrationId, integrationId),
    columns: { id: true, owner: true, name: true },
  });

  for (const repo of repositories) {
    const events = await octokit.paginate(
      "GET /repos/{owner}/{repo}/events",
      { owner: repo.owner, repo: repo.name, per_page: 100 },
      (response, done) => {
        if (response.data.length === 0) {
          done();
          return [];
        }

        const filteredEvents = response.data.filter((event) => {
          if (!event.created_at) {
            return true;
          }
          return new Date(event.created_at) > maxEventDate;
        });
        if (filteredEvents.length !== response.data.length) {
          done();
        }

        return filteredEvents;
      },
    );

    if (events.length === 0) {
      continue;
    }

    try {
      const batchUpserts = events.map((event) => {
        return db
          .insert(schema.githubEvent)
          .values({
            id: nanoid(),
            githubId: event.id.toString(),
            githubActorId: event.actor.id.toString(),
            insertedAt: new Date(),
            createdAt: event.created_at
              ? new Date(event.created_at)
              : new Date(),
            repositoryId: repo.id,
            type: event.type ?? "UnknownEvent",
            payload: event.payload,
          })
          .onConflictDoUpdate({
            target: schema.githubEvent.githubId,
            setWhere: eq(schema.githubEvent.githubId, event.id.toString()),
            set: {
              insertedAt: new Date(),
              createdAt: event.created_at
                ? new Date(event.created_at)
                : new Date(),
              repositoryId: repo.id,
              type: event.type ?? "UnknownEvent",
              githubActorId: event.actor.id.toString(),
              payload: event.payload,
            },
          });
      });
      if (isTuple(batchUpserts)) {
        await db.batch(batchUpserts);
      }
    } catch (error) {
      console.error(error);
    }
  }
}
