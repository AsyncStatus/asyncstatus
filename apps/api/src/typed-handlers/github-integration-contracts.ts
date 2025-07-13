import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";
import { GithubIntegration, GithubRepository, GithubUser } from "../db";

export const githubIntegrationCallbackContract = typedContract(
  "get /integrations/github/callback",
  z.object({ installation_id: z.string(), state: z.string() }),
  z.instanceof(Response),
);

export const getGithubIntegrationContract = typedContract(
  "get /organizations/:idOrSlug/integrations/github",
  z.strictObject({ idOrSlug: z.string().min(1) }),
  GithubIntegration.nullable(),
);

export const listGithubRepositoriesContract = typedContract(
  "get /organizations/:idOrSlug/integrations/github/repositories",
  z.strictObject({ idOrSlug: z.string().min(1) }),
  z.array(GithubRepository),
);

export const listGithubUsersContract = typedContract(
  "get /organizations/:idOrSlug/integrations/github/users",
  z.strictObject({ idOrSlug: z.string().min(1) }),
  z.array(GithubUser),
);

export const deleteGithubIntegrationContract = typedContract(
  "delete /organizations/:idOrSlug/integrations/github",
  z.strictObject({ idOrSlug: z.string().min(1) }),
  z.strictObject({ success: z.boolean() }),
);
