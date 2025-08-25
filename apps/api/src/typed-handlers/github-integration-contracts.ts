import { GithubIntegration, GithubRepository, GithubUser } from "@asyncstatus/db";
import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";

export const githubIntegrationCallbackContract = typedContract(
  "get /integrations/github/callback",
  z.object({ redirect: z.string().optional() }),
  z.instanceof(Response),
);

export const getGithubIntegrationContract = typedContract(
  "get /organizations/:idOrSlug/integrations/github",
  z.strictObject({ idOrSlug: z.string().min(1) }),
  GithubIntegration.nullable(),
);

export const resyncGithubIntegrationContract = typedContract(
  "post /organizations/:idOrSlug/integrations/github/resync",
  z.strictObject({ idOrSlug: z.string().min(1) }),
  z.strictObject({ success: z.boolean() }),
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
