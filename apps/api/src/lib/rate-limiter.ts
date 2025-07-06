import { WorkersKVStore } from "@hono-rate-limiter/cloudflare";
import { rateLimiter } from "hono-rate-limiter";
import type { HonoEnv } from "./env";

export function createRateLimiter(
  env: HonoEnv["Bindings"],
  options: { windowMs: number; limit: number },
) {
  return rateLimiter<HonoEnv>({
    windowMs: options.windowMs, // 15 minutes
    limit: options.limit, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: "draft-6", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    keyGenerator: (c) => c.req.header("cf-connecting-ip") ?? "", // Method to generate custom identifiers for clients.
    store: new WorkersKVStore({ namespace: env.RATE_LIMITER }), // Here CACHE is your WorkersKV Binding.
  });
}

export type RateLimiter = ReturnType<typeof createRateLimiter>;
