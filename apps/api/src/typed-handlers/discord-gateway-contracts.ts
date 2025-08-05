import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";

export const startDiscordGatewayContract = typedContract(
  "post /organizations/:idOrSlug/discord-gateway/start",
  z.strictObject({ idOrSlug: z.string().min(1) }),
  z.strictObject({
    success: z.boolean(),
    message: z.string(),
  }),
);

export const stopDiscordGatewayContract = typedContract(
  "post /organizations/:idOrSlug/discord-gateway/stop",
  z.strictObject({ idOrSlug: z.string().min(1) }),
  z.strictObject({
    success: z.boolean(),
    message: z.string(),
  }),
);

export const getDiscordGatewayStatusContract = typedContract(
  "get /organizations/:idOrSlug/discord-gateway/status",
  z.strictObject({ idOrSlug: z.string().min(1) }),
  z.strictObject({
    isConnected: z.boolean(),
    hasIntegration: z.boolean(),
    sessionId: z.string().nullable(),
    sequenceNumber: z.number().nullable(),
    connectionAttempts: z.number(),
    lastHeartbeat: z.number().nullable(),
    error: z.string().optional(),
  }),
);
