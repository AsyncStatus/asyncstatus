import { typedContractFetchFactory } from "@asyncstatus/typed-handlers/fetch";
import {
  typedMutationOptionsFactory,
  typedQueryOptionsFactory,
} from "@asyncstatus/typed-handlers/tanstack-query";
import { typedUrlFactory } from "@asyncstatus/typed-handlers/url";
import { getIncomingHeaders } from "./get-incoming-headers";

export const typedContractFetch = typedContractFetchFactory(
  import.meta.env.VITE_CHANGELOG_API_URL,
  () => {
    const headers = new Headers();
    headers.set("cookie", (getIncomingHeaders() as any)["cookie"] ?? "");
    return { credentials: "include", headers };
  },
);
export const typedQueryOptions = typedQueryOptionsFactory(typedContractFetch);
export const typedMutationOptions = typedMutationOptionsFactory(typedContractFetch);
export const typedUrl = typedUrlFactory(import.meta.env.VITE_CHANGELOG_API_URL);
