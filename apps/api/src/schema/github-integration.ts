import { z } from "zod/v4";

export const SyncGithubWorkflowStatusName = {
  start: "start",
  fetchAndSyncRepositories: "fetch_and_sync_repositories",
  fetchAndSyncUsers: "fetch_and_sync_users",
} as const;

export const SyncGithubWorkflowStatusStep = {
  pending: "pending",
  error: "error",
  success: "success",
} as const;

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

export const zGithubRepositoryResponse = z.object({
  id: z.string(),
  integrationId: z.string(),
  repoId: z.string(),
  name: z.string(),
  fullName: z.string(),
  private: z.boolean(),
  htmlUrl: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const zGithubRepositoryCreate = z.object({
  repoId: z.string(),
  name: z.string(),
  fullName: z.string(),
  private: z.boolean(),
  htmlUrl: z.string(),
  description: z.string().optional(),
});

export const zGithubUserResponse = z.object({
  id: z.string(),
  integrationId: z.string(),
  githubId: z.string(),
  login: z.string(),
  avatarUrl: z.string().nullable().optional(),
  htmlUrl: z.string(),
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const zGithubUserCreate = z.object({
  githubId: z.string(),
  login: z.string(),
  avatarUrl: z.string().optional(),
  htmlUrl: z.string(),
  name: z.string().optional(),
  email: z.string().optional(),
});

export type GithubIntegration = z.infer<typeof zGithubIntegrationResponse>;
export type GithubRepository = z.infer<typeof zGithubRepositoryResponse>;
export type GithubUser = z.infer<typeof zGithubUserResponse>;
