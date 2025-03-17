import type { App } from "@asyncstatus/api";
import { hc } from "hono/client";

export const rpc = hc<App>(import.meta.env.VITE_API_URL);
