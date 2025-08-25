import { GitlabIntegration, GitlabProject, GitlabUser } from "@asyncstatus/db";
import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";

export const gitlabIntegrationCallbackContract = typedContract(
  "get /integrations/gitlab/callback",
  z.object({ redirect: z.string().optional() }),
  z.instanceof(Response),
);

export const gitlabIntegrationCallbackAddContract = typedContract(
  "get /integrations/gitlab/callback/add",
  z.object({ code: z.string(), state: z.string(), redirect: z.string().optional() }),
  z.instanceof(Response),
);

export const getGitlabIntegrationContract = typedContract(
  "get /organizations/:idOrSlug/integrations/gitlab",
  z.strictObject({ idOrSlug: z.string().min(1) }),
  GitlabIntegration.nullable(),
);

export const resyncGitlabIntegrationContract = typedContract(
  "post /organizations/:idOrSlug/integrations/gitlab/resync",
  z.strictObject({ idOrSlug: z.string().min(1) }),
  z.strictObject({ success: z.boolean() }),
);

export const listGitlabProjectsContract = typedContract(
  "get /organizations/:idOrSlug/integrations/gitlab/projects",
  z.strictObject({ idOrSlug: z.string().min(1) }),
  z.array(GitlabProject),
);

export const listGitlabUsersContract = typedContract(
  "get /organizations/:idOrSlug/integrations/gitlab/users",
  z.strictObject({ idOrSlug: z.string().min(1) }),
  z.array(GitlabUser),
);

export const deleteGitlabIntegrationContract = typedContract(
  "delete /organizations/:idOrSlug/integrations/gitlab",
  z.strictObject({ idOrSlug: z.string().min(1) }),
  z.strictObject({ success: z.boolean() }),
);
