import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";
import { Member, Organization, OrganizationUpdate, User } from "../db";

export const listMemberOrganizationsContract = typedContract(
  "get /organizations/member",
  z.strictObject({}),
  z.array(z.strictObject({ organization: Organization, member: Member })),
);

export const getOrganizationContract = typedContract(
  "get /organizations/:idOrSlug",
  z.strictObject({ idOrSlug: z.string().min(1) }),
  z.strictObject({ organization: Organization, member: Member }),
);

export const getOrganizationUserContract = typedContract(
  "get /organizations/:idOrSlug/user/:userId",
  z.strictObject({ idOrSlug: z.string().min(1), userId: z.string().min(1) }),
  z.strictObject({ ...User.shape }),
);

export const setActiveOrganizationContract = typedContract(
  "patch /organizations/:idOrSlug/set-active",
  z.strictObject({ idOrSlug: z.string().min(1) }),
  Organization,
);

export const createOrganizationContract = typedContract(
  "post /organizations",
  z.strictObject({
    name: z.string().min(1).trim(),
    slug: z.string().min(1).trim(),
    logo: z
      .file()
      .max(1024 * 1024 * 10)
      .optional(),
  }),
  z.strictObject({ organization: Organization, member: Member }),
);

export const updateOrganizationContract = typedContract(
  "patch /organizations/:idOrSlug",
  z.strictObject({
    idOrSlug: z.string().min(1),
    name: OrganizationUpdate.shape.name,
    slug: OrganizationUpdate.shape.slug,
    logo: OrganizationUpdate.shape.logo.or(z.file().max(1024 * 1024 * 10)),
  }),
  Organization,
);
