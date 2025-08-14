import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";
import { SlackChannel, SlackIntegration, SlackUser } from "../db";

export const slackIntegrationCallbackContract = typedContract(
  "get /integrations/slack/callback",
  z.object({ redirect: z.string().optional() }),
  z.instanceof(Response),
);

export const slackUserIntegrationCallbackContract = typedContract(
  "get /integrations/slack/user/callback",
  z.any(),
  z.instanceof(Response),
);

export const getSlackIntegrationContract = typedContract(
  "get /organizations/:idOrSlug/integrations/slack",
  z.strictObject({ idOrSlug: z.string().min(1) }),
  SlackIntegration.nullable(),
);

export const listSlackChannelsContract = typedContract(
  "get /organizations/:idOrSlug/integrations/slack/channels",
  z.strictObject({ idOrSlug: z.string().min(1) }),
  z.array(SlackChannel),
);

export const listSlackUsersContract = typedContract(
  "get /organizations/:idOrSlug/integrations/slack/users",
  z.strictObject({ idOrSlug: z.string().min(1) }),
  z.array(SlackUser),
);

export const deleteSlackIntegrationContract = typedContract(
  "delete /organizations/:idOrSlug/integrations/slack",
  z.strictObject({ idOrSlug: z.string().min(1) }),
  z.strictObject({ success: z.boolean() }),
);
