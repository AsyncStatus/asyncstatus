import { Changelog, ChangelogGenerationJob, ChangelogGithubRepository } from "@asyncstatus/db";
import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";

const filtersSchema = z
  .string()
  .refine((value) => value.split("..").length === 2, {
    message: "Filters must be in the format of start..end",
  })
  .refine(
    (value) => {
      const [start, end] = value.split("..");
      return (
        start?.length &&
        start?.length > 7 &&
        start?.length < 40 &&
        end?.length &&
        end?.length > 7 &&
        end?.length < 40
      );
    },
    {
      message: "Filters must be valid commit range (7-40 characters)",
    },
  );

export const listChangelogsByRepoContract = typedContract(
  "get /changelogs",
  z.strictObject({
    owner: z.string(),
    repo: z.string().optional(),
    filters: filtersSchema.optional(),
  }),
  z.strictObject({
    changelogs: z.array(z.strictObject({ ...Changelog.shape })),
    changelogGenerationJobs: z.array(z.strictObject({ ...ChangelogGenerationJob.shape })),
  }),
);

export const listReposByOwnerContract = typedContract(
  "get /repos/:owner",
  z.strictObject({ owner: z.string() }),
  z.array(z.strictObject({ ...ChangelogGithubRepository.shape })),
);

export const getChangelogBySlugContract = typedContract(
  "get /changelogs/slug/:slug",
  z.strictObject({ slug: z.string() }),
  z.strictObject({ ...Changelog.shape }),
);

export const startChangelogGenerationContract = typedContract(
  "post /changelogs/generate",
  z.strictObject({
    url: z
      .url({ hostname: /github\.com/, pattern: /\/[\w-]+\/[\w-]+/i, protocol: /https/i })
      .normalize(),
    filters: filtersSchema,
  }),
  z.strictObject({ ...ChangelogGenerationJob.shape }),
);
