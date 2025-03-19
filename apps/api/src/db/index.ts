import { drizzle } from "drizzle-orm/libsql";

import type { Bindings } from "../lib/env";

export function createDb(env: Bindings) {
  return drizzle({
    connection: { url: env.TURSO_URL, authToken: env.TURSO_AUTH_TOKEN },
  });
}
