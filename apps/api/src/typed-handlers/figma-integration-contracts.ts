import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";

export const figmaIntegrationCallbackContract = typedContract(
  "get /integrations/figma/callback",
  z.object({
    code: z.string(),
    state: z.string().optional(),
    redirect: z.string().optional(),
  }),
  z.instanceof(Response),
);

export const getFigmaIntegrationContract = typedContract(
  "get /organizations/:organizationSlug/integrations/figma",
  z.object({ organizationSlug: z.string() }),
  z.object({
    id: z.string(),
    teamId: z.string(),
    teamName: z.string().nullable(),
    syncStartedAt: z.date().nullable(),
    syncFinishedAt: z.date().nullable(),
    syncError: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
);

export const deleteFigmaIntegrationContract = typedContract(
  "delete /organizations/:organizationSlug/integrations/figma",
  z.object({ organizationSlug: z.string() }),
  z.object({
    success: z.boolean(),
  }),
);

export const resyncFigmaIntegrationContract = typedContract(
  "post /organizations/:organizationSlug/integrations/figma/resync",
  z.object({ organizationSlug: z.string() }),
  z.object({
    workflowId: z.string(),
  }),
);

export const listFigmaTeamsContract = typedContract(
  "get /organizations/:organizationSlug/integrations/figma/teams",
  z.object({ organizationSlug: z.string() }),
  z.array(
    z.object({
      id: z.string(),
      teamId: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      plan: z.string().nullable(),
    })
  ),
);

export const listFigmaProjectsContract = typedContract(
  "get /organizations/:organizationSlug/integrations/figma/projects",
  z.object({
    organizationSlug: z.string(),
    teamId: z.string().optional(),
  }),
  z.array(
    z.object({
      id: z.string(),
      projectId: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      teamId: z.string(),
    })
  ),
);

export const listFigmaFilesContract = typedContract(
  "get /organizations/:organizationSlug/integrations/figma/files",
  z.object({
    organizationSlug: z.string(),
    projectId: z.string().optional(),
    fileType: z.enum(["design", "figjam", "dev_mode"]).optional(),
  }),
  z.array(
    z.object({
      id: z.string(),
      fileKey: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      fileType: z.enum(["design", "figjam", "dev_mode"]),
      thumbnailUrl: z.string().nullable(),
      lastModified: z.date().nullable(),
      projectId: z.string(),
    })
  ),
);

export const listFigmaUsersContract = typedContract(
  "get /organizations/:organizationSlug/integrations/figma/users",
  z.object({ organizationSlug: z.string() }),
  z.array(
    z.object({
      id: z.string(),
      figmaId: z.string(),
      handle: z.string(),
      email: z.string().nullable(),
      name: z.string().nullable(),
      imgUrl: z.string().nullable(),
    })
  ),
);

export const figmaWebhookContract = typedContract(
  "post /integrations/figma/webhook",
  z.any(),
  z.object({
    success: z.boolean(),
  }),
);