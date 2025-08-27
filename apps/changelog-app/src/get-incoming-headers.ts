import { createIsomorphicFn } from "@tanstack/react-start";
import { getHeaders } from "@tanstack/react-start/server";

export const getIncomingHeaders = createIsomorphicFn()
  .client(() => ({}))
  .server(() => getHeaders());
