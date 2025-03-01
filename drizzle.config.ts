import { defineConfig } from "drizzle-kit";
import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error("Please define DATABASE_URL in your environment variables.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./utils/supabase/schema.ts",
//   driver: "pg",
  out: "./migrations",
  dbCredentials: {
    url: databaseUrl!,
  },
});
