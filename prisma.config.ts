// Prisma reads DATABASE_URL from here before `next dev`/`next build` start, so
// it can't rely on Next's own env loading. Load the same files Next does —
// `.env.local` overrides `.env` — so a connection string placed in either one
// works for migrations as well as the running app.
import { config as loadEnv } from "dotenv";
import { defineConfig, env } from "prisma/config";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"] || env("DATABASE_URL"),
  },
});
