import { z } from "zod/v4";
import { eq } from "drizzle-orm";
import type { Db } from "../../db/db";
import * as schema from "../../db";

const InputSchema = z.object({
  projectId: z.string().describe("The Figma project ID (internal or external)"),
});

const OutputSchema = z.object({
  project: z
    .object({
      id: z.string(),
      projectId: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      team: z.object({
        id: z.string(),
        teamId: z.string(),
        name: z.string(),
      }),
      fileCount: z.number(),
    })
    .nullable()
    .describe("The Figma project details, or null if not found"),
});

export const getFigmaProjectTool = ({ db }: { db: Db }) => ({
  name: "get_figma_project",
  description: "Get details about a specific Figma project",
  parameters: InputSchema,
  execute: async (input: z.infer<typeof InputSchema>) => {
    const project = await db.query.figmaProject.findFirst({
      where: eq(schema.figmaProject.projectId, input.projectId),
      with: {
        team: true,
        files: true,
      },
    });

    if (!project) {
      return { project: null };
    }

    return {
      project: {
        id: project.id,
        projectId: project.projectId,
        name: project.name,
        description: project.description,
        team: {
          id: project.team.id,
          teamId: project.team.teamId,
          name: project.team.name,
        },
        fileCount: project.files.length,
      },
    };
  },
});