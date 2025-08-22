import { createRPCContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";

export const teamsIntegrationCallbackContract = createRPCContract({
  pathTemplate: "/teams/oauth/callback",
  schemas: {
    input: z.object({
      redirect: z.string().optional(),
    }),
    output: z.any(),
  },
});

export const teamsAddIntegrationCallbackContract = createRPCContract({
  pathTemplate: "/teams/oauth/add-integration/callback",
  schemas: {
    input: z.object({
      code: z.string(),
      state: z.string(), // organizationSlug
      session_state: z.string().optional(),
      error: z.string().optional(),
      error_description: z.string().optional(),
    }),
    output: z.any(),
  },
});

export const getTeamsIntegrationContract = createRPCContract({
  pathTemplate: "/teams/integration",
  schemas: {
    input: z.void(),
    output: z.object({
      id: z.string(),
      organizationId: z.string(),
      tenantId: z.string(),
      teamId: z.string().nullable(),
      teamName: z.string().nullable(),
      appId: z.string().nullable(),
      botUserId: z.string().nullable(),
      createdAt: z.date(),
      updatedAt: z.date(),
      syncStartedAt: z.date().nullable(),
      syncFinishedAt: z.date().nullable(),
      syncError: z.string().nullable(),
    }),
  },
});

export const deleteTeamsIntegrationContract = createRPCContract({
  pathTemplate: "/teams/integration",
  method: "DELETE",
  schemas: {
    input: z.void(),
    output: z.object({
      success: z.boolean(),
    }),
  },
});

export const listTeamsChannelsContract = createRPCContract({
  pathTemplate: "/teams/channels",
  schemas: {
    input: z.void(),
    output: z.array(
      z.object({
        id: z.string(),
        channelId: z.string(),
        teamId: z.string(),
        displayName: z.string(),
        description: z.string().nullable(),
        email: z.string().nullable(),
        webUrl: z.string().nullable(),
        membershipType: z.string().nullable(),
        isArchived: z.boolean(),
        createdAt: z.date(),
      })
    ),
  },
});

export const listTeamsUsersContract = createRPCContract({
  pathTemplate: "/teams/users",
  schemas: {
    input: z.void(),
    output: z.array(
      z.object({
        id: z.string(),
        userId: z.string(),
        displayName: z.string(),
        email: z.string().nullable(),
        userPrincipalName: z.string().nullable(),
        jobTitle: z.string().nullable(),
        department: z.string().nullable(),
        isGuest: z.boolean(),
        createdAt: z.date(),
      })
    ),
  },
});

export const syncTeamsIntegrationContract = createRPCContract({
  pathTemplate: "/teams/sync",
  method: "POST",
  schemas: {
    input: z.void(),
    output: z.object({
      success: z.boolean(),
      workflowId: z.string(),
    }),
  },
});

export const refreshTeamsTokenContract = createRPCContract({
  pathTemplate: "/teams/refresh-token",
  method: "POST",
  schemas: {
    input: z.void(),
    output: z.object({
      success: z.boolean(),
      expiresAt: z.date().nullable(),
    }),
  },
});