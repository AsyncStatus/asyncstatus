import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import type { TypedHandlersContextWithOrganization } from "../lib/env";
import { getFileContract } from "./file-contracts";
import { requiredOrganization, requiredSession } from "./middleware";

export const getFileHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof getFileContract
>(getFileContract, requiredSession, requiredOrganization, async ({ input, bucket }) => {
  const object = await bucket.private.get(input.fileKey);
  if (!object) {
    throw new TypedHandlersError({
      code: "NOT_FOUND",
      message: "File not found",
    });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  headers.set("Cache-Control", "private, max-age=600"); // 10 minutes
  if (object.httpMetadata?.contentType) {
    headers.set("Content-Type", object.httpMetadata.contentType);
  }

  return new Response(object.body, { headers });
});
