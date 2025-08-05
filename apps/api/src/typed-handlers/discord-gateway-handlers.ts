import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { eq } from "drizzle-orm";
import * as schema from "../db";
import type { TypedHandlersContextWithOrganization } from "../lib/env";
import {
  getDiscordGatewayStatusContract,
  startDiscordGatewayContract,
  stopDiscordGatewayContract,
} from "./discord-gateway-contracts";
import { requiredOrganization, requiredSession } from "./middleware";

export const startDiscordGatewayHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof startDiscordGatewayContract
>(
  startDiscordGatewayContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, discord }) => {
    // Find the Discord integration
    const integration = await db.query.discordIntegration.findFirst({
      where: eq(schema.discordIntegration.organizationId, organization.id),
    });

    if (!integration) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Discord integration not found",
      });
    }

    // Get or create Durable Object ID
    let durableObjectId = integration.gatewayDurableObjectId;
    if (!durableObjectId) {
      // Generate a new Durable Object ID if not exists
      durableObjectId = crypto.randomUUID();
      await db
        .update(schema.discordIntegration)
        .set({ gatewayDurableObjectId: durableObjectId })
        .where(eq(schema.discordIntegration.id, integration.id));
    }

    const durableObject = discord.gatewayDo.get(discord.gatewayDo.idFromName(durableObjectId));

    // Start Discord Gateway using RPC
    const result = await durableObject.startGateway(integration.id);

    if (!result.success) {
      throw new TypedHandlersError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to start Discord Gateway: ${result.message}`,
      });
    }

    return {
      success: true,
      message: result.message,
    };
  },
);

export const stopDiscordGatewayHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof stopDiscordGatewayContract
>(
  stopDiscordGatewayContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, discord }) => {
    // Find the Discord integration
    const integration = await db.query.discordIntegration.findFirst({
      where: eq(schema.discordIntegration.organizationId, organization.id),
    });

    if (!integration || !integration.gatewayDurableObjectId) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Discord integration or Gateway Durable Object not found",
      });
    }

    const durableObject = discord.gatewayDo.get(
      discord.gatewayDo.idFromName(integration.gatewayDurableObjectId),
    );

    // Stop Discord Gateway using RPC
    const result = await durableObject.stopGateway();

    if (!result.success) {
      throw new TypedHandlersError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to stop Discord Gateway: ${result.message}`,
      });
    }

    return {
      success: true,
      message: result.message,
    };
  },
);

export const getDiscordGatewayStatusHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof getDiscordGatewayStatusContract
>(
  getDiscordGatewayStatusContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, discord }) => {
    // Check if Discord integration exists
    const integration = await db.query.discordIntegration.findFirst({
      where: eq(schema.discordIntegration.organizationId, organization.id),
    });

    if (!integration) {
      return {
        isConnected: false,
        hasIntegration: false,
        sessionId: null,
        sequenceNumber: null,
        connectionAttempts: 0,
        lastHeartbeat: null,
      };
    }

    if (!integration.gatewayDurableObjectId) {
      return {
        isConnected: false,
        hasIntegration: true,
        sessionId: null,
        sequenceNumber: null,
        connectionAttempts: 0,
        lastHeartbeat: null,
        error: "Gateway Durable Object not initialized",
      };
    }

    const durableObject = discord.gatewayDo.get(
      discord.gatewayDo.idFromName(integration.gatewayDurableObjectId),
    );

    // Get status from Durable Object using RPC
    try {
      const status = await durableObject.getStatus();

      return {
        isConnected: status.isConnected,
        hasIntegration: true,
        sessionId: status.sessionId,
        sequenceNumber: status.sequenceNumber,
        connectionAttempts: status.connectionAttempts,
        lastHeartbeat: status.lastHeartbeat,
      };
    } catch (error) {
      return {
        isConnected: false,
        hasIntegration: true,
        sessionId: null,
        sequenceNumber: null,
        connectionAttempts: 0,
        lastHeartbeat: null,
        error: "Failed to get Gateway status",
      };
    }
  },
);
