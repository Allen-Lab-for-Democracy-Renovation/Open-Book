// Loads DATABASE_URL for scripts run with tsx, which (unlike `next dev`)
// doesn't read env files on its own. Same order as prisma.config.ts:
// `.env.local` wins over `.env`.
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });
