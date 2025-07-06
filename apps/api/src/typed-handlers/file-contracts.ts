import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";

export const getFileContract = typedContract(
  "get /organization/:idOrSlug/file/:fileKey",
  z.strictObject({ idOrSlug: z.string().min(1), fileKey: z.string().min(1) }),
  z.instanceof(Response),
);
