import { z } from "zod/v4";
import { eq } from "drizzle-orm";
import type { Db } from "../../db/db";
import * as schema from "../../db";

const InputSchema = z.object({
  fileKey: z.string().describe("The Figma file key"),
});

const OutputSchema = z.object({
  file: z
    .object({
      id: z.string(),
      fileKey: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      fileType: z.enum(["design", "figjam", "dev_mode"]),
      thumbnailUrl: z.string().nullable(),
      lastModified: z.date().nullable(),
      projectId: z.string(),
      project: z
        .object({
          id: z.string(),
          name: z.string(),
          teamId: z.string(),
        })
        .nullable(),
    })
    .nullable()
    .describe("The Figma file details, or null if not found"),
});

export const getFigmaFileTool = ({ db }: { db: Db }) => ({
  name: "get_figma_file",
  description: "Get details about a specific Figma file",
  parameters: InputSchema,
  execute: async (input: z.infer<typeof InputSchema>) => {
    const file = await db.query.figmaFile.findFirst({
      where: eq(schema.figmaFile.fileKey, input.fileKey),
      with: {
        project: {
          with: {
            team: true,
          },
        },
      },
    });

    if (!file) {
      return { file: null };
    }

    return {
      file: {
        id: file.id,
        fileKey: file.fileKey,
        name: file.name,
        description: file.description,
        fileType: file.fileType as "design" | "figjam" | "dev_mode",
        thumbnailUrl: file.thumbnailUrl,
        lastModified: file.lastModified,
        projectId: file.projectId,
        project: file.project
          ? {
              id: file.project.id,
              name: file.project.name,
              teamId: file.project.teamId,
            }
          : null,
      },
    };
  },
});