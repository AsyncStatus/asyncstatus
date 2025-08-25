import { config } from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

if (process.env.NODE_ENV !== "production") {
  config({ path: ".dev.vars" });
}

const db = drizzle({
  connection: {
    url: process.env.TURSO_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
});
await migrate(db, { migrationsFolder: "./drizzle" });
