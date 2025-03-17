import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

const processEnv = {} as Record<string, string>;
config({ path: ".dev.vars", processEnv });

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "turso",
  dbCredentials: {
    url: processEnv.TURSO_URL!,
    authToken: processEnv.TURSO_AUTH_TOKEN!,
  },
});
