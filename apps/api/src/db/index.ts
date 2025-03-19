import type { Bindings } from "@asyncstatus/api/lib/env";
import { drizzle } from "drizzle-orm/libsql";

export function createDb(env: Bindings) {
  return drizzle({
    connection: { url: env.TURSO_URL, authToken: env.TURSO_AUTH_TOKEN },
  });
}
