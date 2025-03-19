import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { Resend } from "resend";

import type { Auth } from "./auth";

export type Bindings = {
  TURSO_URL: string;
  TURSO_AUTH_TOKEN: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  AS_PROD_AUTH_KV: KVNamespace;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  RESEND_API_KEY: string;
};

export type Variables = {
  auth: Auth;
  db: LibSQLDatabase;
  resend: Resend;
  user: Auth["$Infer"]["Session"]["user"] | null;
  session: Auth["$Infer"]["Session"]["session"] | null;
};

export type HonoEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
