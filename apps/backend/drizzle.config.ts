import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://nutrisnap:nutrisnap_secret@localhost:5432/nutrisnap_db",
  },
  verbose: true,
  strict: true,
});

