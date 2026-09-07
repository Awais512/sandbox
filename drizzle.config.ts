import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"

// Load .env.local where Next.js / Neon environment variables are stored
config({ path: ".env.local" })

const databaseUrl =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error(
    "Neither DATABASE_URL_UNPOOLED nor DATABASE_URL is set in .env.local"
  )
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
})
