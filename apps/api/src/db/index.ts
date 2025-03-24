import { drizzle } from "drizzle-orm/libsql";

import type { Bindings } from "../lib/env";
import * as schema from "./schema";

export function createDb(env: Bindings) {
  return drizzle({
    schema,
    connection: { url: env.TURSO_URL, authToken: env.TURSO_AUTH_TOKEN },
  });
}

export type Db = ReturnType<typeof createDb>;
