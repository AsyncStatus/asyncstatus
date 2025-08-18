import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";
import { DiscordChannel, DiscordIntegration, DiscordServer, DiscordUser } from "../db";

export const discordIntegrationCallbackContract = typedContract(
  "get /integrations/discord/callback",
  z.object({ redirect: z.string().optional() }),
  z.instanceof(Response),
);

export const discordAddIntegrationCallbackContract = typedContract(
  "get /integrations/discord/callback/add",
  z.object({ code: z.string(), state: z.string(), guild_id: z.string(), permissions: z.string() }),
  z.instanceof(Response),
);

export const getDiscordIntegrationContract = typedContract(
  "get /organizations/:idOrSlug/integrations/discord",
  z.strictObject({ idOrSlug: z.string().min(1) }),
  DiscordIntegration.nullable(),
);

export const listDiscordServersContract = typedContract(
  "get /organizations/:idOrSlug/integrations/discord/servers",
  z.strictObject({ idOrSlug: z.string().min(1) }),
  z.array(DiscordServer),
);

export const listDiscordChannelsContract = typedContract(
  "get /organizations/:idOrSlug/integrations/discord/channels",
  z.strictObject({ idOrSlug: z.string().min(1) }),
  z.array(DiscordChannel),
);

export const listDiscordUsersContract = typedContract(
  "get /organizations/:idOrSlug/integrations/discord/users",
  z.strictObject({ idOrSlug: z.string().min(1) }),
  z.array(DiscordUser),
);

export const deleteDiscordIntegrationContract = typedContract(
  "delete /organizations/:idOrSlug/integrations/discord",
  z.strictObject({ idOrSlug: z.string().min(1) }),
  z.strictObject({ success: z.boolean() }),
);

export const fetchDiscordMessagesContract = typedContract(
  "post /organizations/:idOrSlug/integrations/discord/fetch-messages",
  z.strictObject({
    idOrSlug: z.string().min(1),
    channelId: z.string().min(1).optional(),
    limit: z.number().min(1).max(100).default(50).optional(),
    before: z.string().optional(),
    after: z.string().optional(),
  }),
  z.strictObject({
    success: z.boolean(),
    workflowId: z.string().optional(),
    messageCount: z.number().optional(),
  }),
);
