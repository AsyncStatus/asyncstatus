import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";

export const slackIntegrationCallbackContract = typedContract(
  "get /integrations/slack/callback",
  z.object({ code: z.string(), state: z.string() }),
  z.instanceof(Response),
);
