import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * 1. USERS TABLE (Google OAuth Identity)
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    googleId: varchar("google_id", { length: 128 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("users_google_id_uq").on(table.googleId),
    uniqueIndex("users_email_uq").on(table.email),
  ]
);

/**
 * 2. USER PROFILES TABLE (Onboarding Metrics, BMI, BMR, TDEE, Surplus/Deficit Targets)
 */
export const userProfiles = pgTable(
  "user_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gender: varchar("gender", { length: 16 }).notNull(), // 'male' | 'female'
    age: integer("age").notNull(),
    heightCm: numeric("height_cm", { precision: 5, scale: 2 }).notNull(),
    currentWeightKg: numeric("current_weight_kg", { precision: 5, scale: 2 }).notNull(),
    targetWeightKg: numeric("target_weight_kg", { precision: 5, scale: 2 }).notNull(),
    targetTimelineMonths: integer("target_timeline_months").notNull(),
    activityLevel: varchar("activity_level", { length: 32 }).default("moderate").notNull(),
    goalType: varchar("goal_type", { length: 24 }).notNull(), // 'bulking' | 'cutting' | 'maintenance'
    bmiScore: numeric("bmi_score", { precision: 5, scale: 2 }).notNull(),
    bmiCategory: varchar("bmi_category", { length: 24 }).notNull(),
    bmrCalories: integer("bmr_calories").notNull(),
    maintenanceCalories: integer("maintenance_calories").notNull(),
    dailyCalorieDelta: integer("daily_calorie_delta").notNull(),
    targetDailyCalories: integer("target_daily_calories").notNull(),
    targetDailyProteinG: integer("target_daily_protein_g").notNull(),
    targetDailyCarbsG: integer("target_daily_carbs_g").notNull(),
    targetDailyFatG: integer("target_daily_fat_g").notNull(),
    timezone: varchar("timezone", { length: 64 }).default("Asia/Jakarta").notNull(),
    onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("user_profiles_user_id_uq").on(table.userId)]
);

/**
 * 3. USER API KEYS TABLE (BYOK AES-256-GCM Encrypted Gemini Key Vault)
 * Format encryptedKey: "iv_base64:authTag_base64:ciphertext_base64"
 */
export const userApiKeys = pgTable(
  "user_api_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    encryptedKey: text("encrypted_key").notNull(),
    keyHint: varchar("key_hint", { length: 32 }).notNull(),
    preferredModel: varchar("preferred_model", { length: 64 })
      .default("gemini-2.5-flash")
      .notNull(),
    isValid: boolean("is_valid").default(true).notNull(),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("user_api_keys_user_id_uq").on(table.userId)]
);

/**
 * 4. MEAL LOGS TABLE (Daily Nutrition Entries: AI Scan or Manual)
 */
export const mealLogs = pgTable(
  "meal_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    loggedDate: date("logged_date").notNull(), // YYYY-MM-DD in user timezone
    mealType: varchar("meal_type", { length: 24 }).notNull(), // 'breakfast' | 'lunch' | 'dinner' | 'snack'
    source: varchar("source", { length: 24 }).notNull(), // 'ai_scan' | 'manual'
    title: varchar("title", { length: 160 }).notNull(),
    imageUrl: text("image_url"),
    aiNotes: text("ai_notes"),
    totalCalories: integer("total_calories").notNull(),
    totalProteinG: numeric("total_protein_g", { precision: 6, scale: 2 }).notNull(),
    totalCarbsG: numeric("total_carbs_g", { precision: 6, scale: 2 }).default("0").notNull(),
    totalFatG: numeric("total_fat_g", { precision: 6, scale: 2 }).default("0").notNull(),
    loggedAt: timestamp("logged_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("idx_meal_logs_user_date").on(table.userId, table.loggedDate)]
);

/**
 * 5. MEAL ITEMS TABLE (Individual Food Components in a Meal Log)
 */
export const mealItems = pgTable(
  "meal_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    mealLogId: uuid("meal_log_id")
      .notNull()
      .references(() => mealLogs.id, { onDelete: "cascade" }),
    foodName: varchar("food_name", { length: 120 }).notNull(),
    weightGrams: numeric("weight_grams", { precision: 7, scale: 2 }).notNull(),
    calories: integer("calories").notNull(),
    proteinG: numeric("protein_g", { precision: 6, scale: 2 }).notNull(),
    carbsG: numeric("carbs_g", { precision: 6, scale: 2 }).default("0").notNull(),
    fatG: numeric("fat_g", { precision: 6, scale: 2 }).default("0").notNull(),
    confidenceScore: numeric("confidence_score", { precision: 4, scale: 2 }),
  },
  (table) => [index("idx_meal_items_meal_log_id").on(table.mealLogId)]
);

/**
 * 6. WEIGHT LOGS TABLE (Historical Body Weight & BMI Progression)
 */
export const weightLogs = pgTable(
  "weight_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recordedDate: date("recorded_date").notNull(),
    weightKg: numeric("weight_kg", { precision: 5, scale: 2 }).notNull(),
    bmiScore: numeric("bmi_score", { precision: 5, scale: 2 }).notNull(),
    notes: varchar("notes", { length: 240 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("idx_weight_logs_user_date").on(table.userId, table.recordedDate)]
);

/**
 * 7. CHAT THREADS & MESSAGES TABLES (Dedicated AI Bulking/Diet Assistant)
 */
export const chatThreads = pgTable(
  "chat_threads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 160 }).default("Diskusi Nutrisi & Bulking").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("idx_chat_threads_user_id").on(table.userId)]
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => chatThreads.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 16 }).notNull(), // 'user' | 'assistant'
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("idx_chat_messages_thread").on(table.threadId, table.createdAt)]
);

/**
 * 8. PUSH SUBSCRIPTIONS TABLE (PWA Scheduled Unlogged Meal Reminders)
 */
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: varchar("p256dh", { length: 255 }).notNull(),
    auth: varchar("auth", { length: 128 }).notNull(),
    reminderEnabled: boolean("reminder_enabled").default(true).notNull(),
    breakfastTime: varchar("breakfast_time", { length: 8 }).default("08:00").notNull(),
    lunchTime: varchar("lunch_time", { length: 8 }).default("13:00").notNull(),
    dinnerTime: varchar("dinner_time", { length: 8 }).default("20:00").notNull(),
    lastBreakfastNotified: date("last_breakfast_notified"),
    lastLunchNotified: date("last_lunch_notified"),
    lastDinnerNotified: date("last_dinner_notified"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("push_subscriptions_endpoint_uq").on(table.endpoint),
    index("idx_push_subscriptions_user_id").on(table.userId),
  ]
);

/**
 * 9. REFERENCE FOODS TABLE (Local Indonesian & Fitness Food Macros per 100g)
 */
export const referenceFoods = pgTable(
  "reference_foods",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    category: varchar("category", { length: 64 }).notNull(),
    caloriesPer100g: integer("calories_per_100g").notNull(),
    proteinPer100g: numeric("protein_per_100g", { precision: 5, scale: 2 }).notNull(),
    carbsPer100g: numeric("carbs_per_100g", { precision: 5, scale: 2 }).notNull(),
    fatPer100g: numeric("fat_per_100g", { precision: 5, scale: 2 }).notNull(),
  },
  (table) => [uniqueIndex("reference_foods_name_uq").on(table.name)]
);

/**
 * DRIZZLE RELATIONS
 */
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  apiKey: one(userApiKeys, {
    fields: [users.id],
    references: [userApiKeys.userId],
  }),
  mealLogs: many(mealLogs),
  weightLogs: many(weightLogs),
  chatThreads: many(chatThreads),
  pushSubscriptions: many(pushSubscriptions),
}));

export const mealLogsRelations = relations(mealLogs, ({ one, many }) => ({
  user: one(users, {
    fields: [mealLogs.userId],
    references: [users.id],
  }),
  items: many(mealItems),
}));

export const mealItemsRelations = relations(mealItems, ({ one }) => ({
  mealLog: one(mealLogs, {
    fields: [mealItems.mealLogId],
    references: [mealLogs.id],
  }),
}));

export const chatThreadsRelations = relations(chatThreads, ({ one, many }) => ({
  user: one(users, {
    fields: [chatThreads.userId],
    references: [users.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  thread: one(chatThreads, {
    fields: [chatMessages.threadId],
    references: [chatThreads.id],
  }),
}));

