import type { LibSQLDatabase } from "drizzle-orm/libsql";

import type { Auth } from "./auth";

export type Bindings = {
  TURSO_URL: string;
  TURSO_AUTH_TOKEN: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
};

export type Variables = {
  auth: Auth;
  db: LibSQLDatabase;
  user: Auth["$Infer"]["Session"]["user"] | null;
  session: Auth["$Infer"]["Session"]["session"] | null;
};

export type HonoEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
