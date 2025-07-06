import { typedContractFetchFactory } from "@asyncstatus/typed-handlers/fetch";
import {
  typedMutationOptionsFactory,
  typedQueryOptionsFactory,
} from "@asyncstatus/typed-handlers/tanstack-query";
import { typedUrlFactory } from "@asyncstatus/typed-handlers/url";

const typedContractFetch = typedContractFetchFactory(`${import.meta.env.VITE_API_URL}/th`, {
  credentials: "include",
});
export const typedQueryOptions = typedQueryOptionsFactory(typedContractFetch);
export const typedMutationOptions = typedMutationOptionsFactory(typedContractFetch);
export const typedUrl = typedUrlFactory(`${import.meta.env.VITE_API_URL}/th`);
