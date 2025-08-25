import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

const processEnv = {} as Record<string, string>;
config({ path: "../../apps/api/.dev.vars", processEnv });

if (!processEnv.TURSO_URL) {
  throw new Error("TURSO_URL is not set");
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/index.ts",
  strict: true,
  verbose: true,
  dialect: "turso",
  dbCredentials: {
    url: processEnv.TURSO_URL,
    authToken: processEnv.TURSO_AUTH_TOKEN,
  },
});
