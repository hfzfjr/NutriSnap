import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  BACKEND_PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z
    .string()
    .default("postgresql://nutrisnap:nutrisnap_secret@localhost:5432/nutrisnap_db"),
  ENCRYPTION_MASTER_KEY: z
    .string()
    .length(64, "ENCRYPTION_MASTER_KEY wajib berupa 64 karakter hex (32 bytes)")
    .regex(/^[0-9a-fA-F]{64}$/, "ENCRYPTION_MASTER_KEY wajib berformat hex")
    .default("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"),
  SESSION_SECRET: z
    .string()
    .min(32)
    .default("nutrisnap-super-secret-session-signing-key-minimum-32-chars"),
  GOOGLE_CLIENT_ID: z.string().default("google-client-id-placeholder"),
  GOOGLE_CLIENT_SECRET: z.string().default("google-client-secret-placeholder"),
  GOOGLE_CALLBACK_URL: z
    .string()
    .url()
    .default("http://localhost:4000/api/v1/auth/google/callback"),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().default("mailto:admin@nutrisnap.app"),
  STORAGE_MODE: z.enum(["local", "s3"]).default("local"),
  STORAGE_LOCAL_DIR: z.string().default("./storage_data"),
});

export type EnvConfig = z.infer<typeof envSchema>;

export const env: EnvConfig = envSchema.parse(process.env);

