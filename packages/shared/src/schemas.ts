import { z } from "zod";

export const genderSchema = z.enum(["male", "female"]);

export const activityLevelSchema = z.enum([
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
]);

export const goalTypeSchema = z.enum(["bulking", "cutting", "maintenance"]);

export const mealTypeSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);

export const mealSourceSchema = z.enum(["ai_scan", "manual"]);

/**
 * 1. Onboarding & User Profile Schemas
 */
export const onboardingInputSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(80),
  gender: genderSchema,
  age: z.coerce.number().int().min(13, "Usia minimal 13 tahun").max(100),
  heightCm: z.coerce.number().min(100, "Tinggi badan minimal 100 cm").max(250),
  currentWeightKg: z.coerce.number().min(25, "Berat badan minimal 25 kg").max(300),
  targetWeightKg: z.coerce.number().min(25, "Target berat badan minimal 25 kg").max(300),
  targetTimelineMonths: z.coerce.number().int().min(1, "Durasi minimal 1 bulan").max(60),
  activityLevel: activityLevelSchema.default("moderate"),
  timezone: z.string().trim().min(2).max(64).default("Asia/Jakarta"),
});

export type OnboardingInput = z.infer<typeof onboardingInputSchema>;

export const createWeightLogSchema = z.object({
  recordedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  weightKg: z.coerce.number().min(25).max(300),
  notes: z.string().max(240).optional(),
});

export type CreateWeightLogInput = z.infer<typeof createWeightLogSchema>;

/**
 * 2. BYOK Gemini API Key Schemas
 */
export const upsertApiKeySchema = z.object({
  apiKey: z
    .string()
    .trim()
    .min(20, "Format Gemini API Key terlalu pendek")
    .max(256, "Format Gemini API Key terlalu panjang"),
  preferredModel: z
    .enum(["gemini-3.8-flash", "gemini-3.8-pro", "gemini-2.5-flash", "gemini-2.5-pro"])
    .default("gemini-3.8-flash"),
});

export type UpsertApiKeyInput = z.infer<typeof upsertApiKeySchema>;

export const apiKeyStatusResponseSchema = z.object({
  hasKey: z.boolean(),
  isValid: z.boolean(),
  keyHint: z.string().nullable(),
  preferredModel: z.string(),
  lastVerifiedAt: z.string().nullable(),
});

export type ApiKeyStatusResponse = z.infer<typeof apiKeyStatusResponseSchema>;

/**
 * 3. Dual Nutrition Logging Schemas (AI Food Photo Scanner & Manual Input)
 */
export const scanFoodPhotoRequestSchema = z.object({
  imageBase64: z
    .string()
    .min(50, "Data gambar tidak valid"),
  mealType: mealTypeSchema.default("lunch"),
  userContextNote: z.string().max(300).optional(),
});

export type ScanFoodPhotoRequest = z.infer<typeof scanFoodPhotoRequestSchema>;

export const mealItemInputSchema = z.object({
  foodName: z.string().trim().min(1, "Nama makanan wajib diisi").max(120),
  weightGrams: z.coerce.number().positive("Berat gram harus lebih dari 0").max(5000),
  calories: z.coerce.number().int().min(0).max(15000),
  proteinG: z.coerce.number().min(0).max(1000),
  carbsG: z.coerce.number().min(0).max(1500).default(0),
  fatG: z.coerce.number().min(0).max(1000).default(0),
  confidence: z.coerce.number().min(0).max(1).optional(),
});

export type MealItemInput = z.infer<typeof mealItemInputSchema>;

export const aiFoodScanResponseSchema = z.object({
  mealTitle: z.string(),
  items: z.array(mealItemInputSchema),
  totals: z.object({
    calories: z.number(),
    proteinG: z.number(),
    carbsG: z.number(),
    fatG: z.number(),
  }),
  nutritionNotes: z.string(),
});

export type AiFoodScanResponse = z.infer<typeof aiFoodScanResponseSchema>;

export const estimateManualFoodRequestSchema = z.object({
  foodName: z.string().trim().min(1, "Nama makanan wajib diisi").max(120),
  weightGrams: z.coerce.number().positive("Berat (gram) harus lebih dari 0").max(5000),
});

export type EstimateManualFoodRequest = z.infer<typeof estimateManualFoodRequestSchema>;

export const createMealLogRequestSchema = z.object({
  loggedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  mealType: mealTypeSchema,
  source: mealSourceSchema,
  title: z.string().trim().min(1).max(160),
  imageUrl: z.string().url().nullable().optional(),
  aiNotes: z.string().max(500).nullable().optional(),
  items: z.array(mealItemInputSchema).min(1, "Minimal harus ada 1 komponen makanan"),
});

export type CreateMealLogRequest = z.infer<typeof createMealLogRequestSchema>;

/**
 * 4. AI Bulking & Diet Assistant Chatbot Schemas
 */
export const sendChatMessageSchema = z.object({
  threadId: z.string().uuid().optional(),
  message: z
    .string()
    .trim()
    .min(1, "Pesan tidak boleh kosong")
    .max(2000, "Pesan maksimal 2000 karakter"),
});

export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>;

/**
 * 5. PWA Scheduled Web Push Notification Schemas
 */
const timeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format jam harus HH:MM (contoh 08:00)");

export const pushSubscriptionInputSchema = z.object({
  endpoint: z.string().url("Endpoint push notification tidak valid"),
  keys: z.object({
    p256dh: z.string().min(10),
    auth: z.string().min(6),
  }),
  reminderEnabled: z.boolean().default(true),
  breakfastTime: timeStringSchema.default("08:00"),
  lunchTime: timeStringSchema.default("13:00"),
  dinnerTime: timeStringSchema.default("20:00"),
});

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionInputSchema>;

export const updatePushPreferencesSchema = z.object({
  reminderEnabled: z.boolean(),
  breakfastTime: timeStringSchema,
  lunchTime: timeStringSchema,
  dinnerTime: timeStringSchema,
});

export type UpdatePushPreferencesInput = z.infer<typeof updatePushPreferencesSchema>;

