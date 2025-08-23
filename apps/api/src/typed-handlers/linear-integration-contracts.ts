import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";
import { LinearIntegration, LinearIssue, LinearProject, LinearTeam } from "../db";
import { LinearUser } from "../db/linear-user";

export const linearIntegrationCallbackContract = typedContract(
  "get /integrations/linear/callback",
  z.object({
    code: z.string(),
    state: z.string().optional(),
  }),
  z.instanceof(Response),
);

export const resyncLinearIntegrationContract = typedContract(
  "post /organizations/:idOrSlug/integrations/linear/resync",
  z.strictObject({
    idOrSlug: z.string().min(1),
  }),
  z.strictObject({
    success: z.boolean(),
    workflowId: z.string(),
  }),
);

export const getLinearIntegrationContract = typedContract(
  "get /organizations/:idOrSlug/integrations/linear",
  z.strictObject({
    idOrSlug: z.string().min(1),
  }),
  LinearIntegration.nullable(),
);

export const listLinearTeamsContract = typedContract(
  "get /organizations/:idOrSlug/integrations/linear/teams",
  z.strictObject({
    idOrSlug: z.string().min(1),
  }),
  z.array(LinearTeam),
);

export const listLinearUsersContract = typedContract(
  "get /organizations/:idOrSlug/integrations/linear/users",
  z.strictObject({
    idOrSlug: z.string().min(1),
  }),
  z.array(LinearUser),
);

export const listLinearIssuesContract = typedContract(
  "get /organizations/:idOrSlug/integrations/linear/issues",
  z.strictObject({
    idOrSlug: z.string().min(1),
    limit: z.coerce.number().optional().default(50),
    offset: z.coerce.number().optional().default(0),
  }),
  z.array(LinearIssue),
);

export const listLinearProjectsContract = typedContract(
  "get /organizations/:idOrSlug/integrations/linear/projects",
  z.strictObject({
    idOrSlug: z.string().min(1),
  }),
  z.array(LinearProject),
);

export const deleteLinearIntegrationContract = typedContract(
  "delete /organizations/:idOrSlug/integrations/linear",
  z.strictObject({
    idOrSlug: z.string().min(1),
  }),
  z.strictObject({
    success: z.boolean(),
    workflowId: z.string(),
  }),
);
