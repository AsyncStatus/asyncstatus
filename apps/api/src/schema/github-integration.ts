import { z } from "zod";

export const zGithubIntegrationResponse = z.object({
  id: z.string(),
  organizationId: z.string(),
  installationId: z.string(),
  accessToken: z.string().nullable().optional(),
  tokenExpiresAt: z.number().nullable().optional(),
  repositories: z.string().nullable().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const zGithubIntegrationCreate = z.object({
  installationId: z.string(),
});

export const zGithubIntegrationUpdate = z.object({
  accessToken: z.string().optional(),
  tokenExpiresAt: z.number().optional(),
  repositories: z.string().optional(),
});

export type GithubIntegration = z.infer<typeof zGithubIntegrationResponse>;
