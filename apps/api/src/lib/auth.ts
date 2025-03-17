import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { type LibSQLDatabase } from "drizzle-orm/libsql";

import type { Bindings } from "./env";

export function createAuth(env: Bindings, db: LibSQLDatabase) {
  return betterAuth({
    url: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: { enabled: true },
    database: drizzleAdapter(db, { provider: "sqlite" }),
    plugins: [
      organization({ teams: { enabled: true, allowRemovingAllTeams: false } }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
