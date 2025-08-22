import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";

export const linearIntegrationCallbackContract = typedContract(
  "get /api/integration/linear/callback",
  z.object({
    code: z.string(),
    state: z.string().optional(),
  }),
  z.instanceof(Response),
);

export const resyncLinearIntegrationContract = typedContract(
  "post /api/integration/linear/resync",
  z.object({}),
  z.object({
    success: z.boolean(),
    workflowId: z.string(),
  }),
);

export const getLinearIntegrationContract = typedContract(
  "get /api/integration/linear",
  z.object({}),
  z.object({
    integration: z
      .object({
        id: z.string(),
        organizationId: z.string(),
        teamId: z.string(),
        teamName: z.string().nullable(),
        syncStartedAt: z.date().nullable(),
        syncFinishedAt: z.date().nullable(),
        syncError: z.string().nullable(),
        syncErrorAt: z.date().nullable(),
        createdAt: z.date(),
        updatedAt: z.date(),
      })
      .nullable(),
  }),
);

export const listLinearTeamsContract = typedContract(
  "get /api/integration/linear/teams",
  z.object({}),
  z.object({
    teams: z.array(
      z.object({
        id: z.string(),
        teamId: z.string(),
        name: z.string(),
        key: z.string(),
        description: z.string().nullable(),
        private: z.boolean().nullable(),
        issueCount: z.number().nullable(),
        createdAt: z.date(),
        updatedAt: z.date(),
      }),
    ),
  }),
);

export const listLinearUsersContract = typedContract(
  "get /api/integration/linear/users",
  z.object({}),
  z.object({
    users: z.array(
      z.object({
        id: z.string(),
        userId: z.string(),
        email: z.string().nullable(),
        name: z.string().nullable(),
        displayName: z.string().nullable(),
        avatarUrl: z.string().nullable(),
        admin: z.boolean().nullable(),
        active: z.boolean().nullable(),
        createdAt: z.date(),
        updatedAt: z.date(),
      }),
    ),
  }),
);

export const listLinearIssuesContract = typedContract(
  "get /api/integration/linear/issues",
  z.object({
    limit: z.number().optional().default(50),
    offset: z.number().optional().default(0),
  }),
  z.object({
    issues: z.array(
      z.object({
        id: z.string(),
        issueId: z.string(),
        identifier: z.string(),
        title: z.string(),
        description: z.string().nullable(),
        state: z.string().nullable(),
        stateType: z.string().nullable(),
        priority: z.number().nullable(),
        priorityLabel: z.string().nullable(),
        assigneeId: z.string().nullable(),
        createdAt: z.date(),
        updatedAt: z.date(),
      }),
    ),
    total: z.number(),
  }),
);

export const listLinearProjectsContract = typedContract(
  "get /api/integration/linear/projects",
  z.object({}),
  z.object({
    projects: z.array(
      z.object({
        id: z.string(),
        projectId: z.string(),
        name: z.string(),
        key: z.string().nullable(),
        description: z.string().nullable(),
        state: z.string().nullable(),
        issueCount: z.number().nullable(),
        completedIssueCount: z.number().nullable(),
        createdAt: z.date(),
        updatedAt: z.date(),
      }),
    ),
  }),
);

export const deleteLinearIntegrationContract = typedContract(
  "delete /api/integration/linear",
  z.object({}),
  z.object({
    success: z.boolean(),
    workflowId: z.string(),
  }),
);