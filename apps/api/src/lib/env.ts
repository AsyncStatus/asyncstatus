import type { Resend } from "resend";

import type { Db } from "../db";
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
  WEB_APP_URL: string;
};

export type Variables = {
  auth: Auth;
  db: Db;
  resend: Resend;
  session: Auth["$Infer"]["Session"] | null;
};

export type HonoEnv = {
  Bindings: Bindings;
  Variables: Variables;
};

export type HonoEnvWithSession = HonoEnv & {
  Variables: Variables & { session: Auth["$Infer"]["Session"] };
};

export type HonoEnvWithOrganization = HonoEnvWithSession & {
  Variables: Variables & {
    organization: Auth["$Infer"]["Organization"];
    member: Auth["$Infer"]["Member"];
  };
};
