import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import * as schema from "../../../db";
import type { Db } from "../../../db/db";
import { isTuple } from "../../../lib/is-tuple";

type FetchAndSyncGitlabProjectsParams = {
  accessToken: string;
  instanceUrl: string;
  db: Db;
  integrationId: string;
};

export async function fetchAndSyncGitlabProjects({
  accessToken,
  instanceUrl,
  db,
  integrationId,
}: FetchAndSyncGitlabProjectsParams) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  };

  let page = 1;
  const perPage = 100;
  let maxIterations = 10;

  while (maxIterations > 0) {
    const url = `${instanceUrl}/api/v4/projects?membership=true&per_page=${perPage}&page=${page}`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Failed to fetch GitLab projects: ${response.status} ${response.statusText}`);
    }

    const projects = await response.json();

    if (!Array.isArray(projects) || projects.length === 0) {
      break;
    }

    const batchUpserts = projects.map((project) => {
      return db
        .insert(schema.gitlabProject)
        .values({
          id: nanoid(),
          integrationId,
          projectId: project.id.toString(),
          name: project.name,
          namespace: project.namespace.name,
          pathWithNamespace: project.path_with_namespace,
          visibility: project.visibility,
          webUrl: project.web_url,
          description: project.description || null,
          defaultBranch: project.default_branch || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.gitlabProject.projectId,
          setWhere: eq(schema.gitlabProject.integrationId, integrationId),
          set: {
            name: project.name,
            namespace: project.namespace.name,
            pathWithNamespace: project.path_with_namespace,
            visibility: project.visibility,
            webUrl: project.web_url,
            description: project.description || null,
            defaultBranch: project.default_branch || null,
            updatedAt: new Date(),
          },
        });
    });

    if (isTuple(batchUpserts)) {
      await db.batch(batchUpserts);
    }

    // Check if there are more pages
    const totalPages = response.headers.get("X-Total-Pages");
    if (totalPages && page >= parseInt(totalPages)) {
      break;
    }

    page++;
    maxIterations--;
  }
}
