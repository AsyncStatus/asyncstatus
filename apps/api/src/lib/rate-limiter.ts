import {
  TYPED_HANDLERS_ERROR_CODES_BY_KEY,
  TYPED_HANDLERS_ERROR_CODES_BY_NUMBER,
  TYPED_HANDLERS_ERROR_STATUS_CODES_BY_KEY,
} from "@asyncstatus/typed-handlers";
import { WorkersKVStore } from "@hono-rate-limiter/cloudflare";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { rateLimiter } from "hono-rate-limiter";
import type { HonoEnv } from "./env";

export function createRateLimiter(
  kvNamespace: KVNamespace<string>,
  options: { windowMs: number; limit: number },
) {
  return rateLimiter<HonoEnv>({
    windowMs: options.windowMs ?? 15 * 60 * 1000, // 15 minutes
    limit: options.limit ?? 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: "draft-6", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    keyGenerator: (c) => c.req.header("cf-connecting-ip") ?? "", // Method to generate custom identifiers for clients.
    store: new WorkersKVStore({ namespace: kvNamespace }), // Here CACHE is your WorkersKV Binding.
    handler: (c) => {
      c.res.headers.set("X-RateLimit-Limit", options.limit.toString());
      c.res.headers.set("X-RateLimit-Remaining", options.limit.toString());
      c.res.headers.set("X-RateLimit-Reset", options.windowMs.toString());
      return c.json(
        {
          type: "TypedHandlersError",
          message: "Too many requests, please try again later.",
          code: TYPED_HANDLERS_ERROR_CODES_BY_NUMBER[
            TYPED_HANDLERS_ERROR_CODES_BY_KEY.TOO_MANY_REQUESTS
          ],
        },
        TYPED_HANDLERS_ERROR_STATUS_CODES_BY_KEY.TOO_MANY_REQUESTS as ContentfulStatusCode,
      );
    },
  });
}

export type RateLimiter = ReturnType<typeof createRateLimiter>;
