import type { InferSelectModel } from "drizzle-orm";
import type { Resend } from "resend";

import type { Db } from "../db";
import * as schema from "../db/schema";
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
  PRIVATE_BUCKET: R2Bucket;
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
    organization: InferSelectModel<typeof schema.organization>;
    member: InferSelectModel<typeof schema.member>;
  };
};
