import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

export function createDb(env: { TURSO_URL: string; TURSO_AUTH_TOKEN: string }) {
  return drizzle({
    schema,
    connection: {
      url: env.TURSO_URL,
      authToken: env.TURSO_AUTH_TOKEN,
    },
  });
}

export type Db = ReturnType<typeof createDb>;
