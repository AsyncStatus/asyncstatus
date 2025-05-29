import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

export function createDb(env: {
  TURSO_URL: string;
  TURSO_AUTH_TOKEN: string;
  TURSO_ENCRYPTION_KEY: string;
}) {
  return drizzle({
    schema,
    connection: {
      url: env.TURSO_URL,
      authToken: env.TURSO_AUTH_TOKEN,
      encryptionKey: env.TURSO_ENCRYPTION_KEY,
    },
  });
}

export type Db = ReturnType<typeof createDb>;
