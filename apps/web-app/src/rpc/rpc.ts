import type { App } from "@asyncstatus/api";
import { hc } from "hono/client";
import { getIncomingHeaders } from "@/get-incoming-headers";

export const rpc = hc<App>(import.meta.env.VITE_API_URL, {
  init: { credentials: "include" },
  headers() {
    return {
      cookie: (getIncomingHeaders() as any)["cookie"] ?? "",
    };
  },
});
