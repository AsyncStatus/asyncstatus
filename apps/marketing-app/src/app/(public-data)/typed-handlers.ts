import { typedContractFetchFactory } from "@asyncstatus/typed-handlers/fetch";

export const typedContractFetch = typedContractFetchFactory(
  process.env.NEXT_PUBLIC_API_URL!,
  () => {
    return { credentials: "include" };
  },
);
