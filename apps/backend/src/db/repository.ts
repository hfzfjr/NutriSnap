import { randomUUID } from "node:crypto";
import { and, asc, desc, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { env } from "../config/env.js";
import {
  chatMessages,
  chatThreads,
  db,
  mealItems,
  mealLogs,
  pushSubscriptions,
  userApiKeys,
  userProfiles,
  users,
  weightLogs,
} from "./index.js";

export interface UserRecord {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfileRecord {
  id: string;
  userId: string;
  gender: "male" | "female";
  age: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  targetTimelineMonths: number;
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goalType: "bulking" | "cutting" | "maintenance";
  bmiScore: number;
  bmiCategory: "underweight" | "normal" | "overweight" | "obese";
  bmrCalories: number;
  maintenanceCalories: number;
  dailyCalorieDelta: number;
  targetDailyCalories: number;
  targetDailyProteinG: number;
  targetDailyCarbsG: number;
  targetDailyFatG: number;
  timezone: string;
  onboardingCompleted: boolean;
  updatedAt: Date;
}

export interface UserApiKeyRecord {
  id: string;
  userId: string;
  encryptedKey: string;
  keyHint: string;
  preferredModel: string;
  isValid: boolean;
  lastVerifiedAt: Date | null;
  updatedAt: Date;
}

export interface MealItemRecord {
  id: string;
  mealLogId: string;
  foodName: string;
  weightGrams: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  confidenceScore: number | null;
}

export interface MealLogRecord {
  id: string;
  userId: string;
  loggedDate: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  source: "ai_scan" | "manual";
  title: string;
  imageUrl: string | null;
  aiNotes: string | null;
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  loggedAt: Date;
  items: MealItemRecord[];
}

export interface WeightLogRecord {
  id: string;
  userId: string;
  recordedDate: string;
  weightKg: number;
  bmiScore: number;
  notes: string | null;
  createdAt: Date;
}

export interface ChatMessageRecord {
  id: string;
  threadId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface PushSubscriptionRecord {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  reminderEnabled: boolean;
  breakfastTime: string;
  lunchTime: string;
  dinnerTime: string;
  lastBreakfastNotified: string | null;
  lastLunchNotified: string | null;
  lastDinnerNotified: string | null;
  updatedAt: Date;
}

// In-memory store untuk mode test atau fallback dev ketika PostgreSQL belum aktif
const memoryStore = {
  users: new Map<string, UserRecord>(),
  profiles: new Map<string, UserProfileRecord>(),
  apiKeys: new Map<string, UserApiKeyRecord>(),
  mealLogs: new Map<string, MealLogRecord>(),
  weightLogs: new Map<string, WeightLogRecord[]>(),
  chatThreads: new Map<string, { id: string; userId: string; title: string; updatedAt: Date }>(),
  chatMessages: new Map<string, ChatMessageRecord[]>(),
  pushSubscriptions: new Map<string, PushSubscriptionRecord>(),
};

let dbAvailable = false;
let dbChecked = false;

export async function ensureDatabaseReady(): Promise<boolean> {
  if (env.NODE_ENV === "test") {
    return false;
  }
  if (dbChecked) {
    return dbAvailable;
  }
  dbChecked = true;

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        google_id VARCHAR(128) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(120) NOT NULL,
        avatar_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        gender VARCHAR(16) NOT NULL,
        age INTEGER NOT NULL,
        height_cm NUMERIC(5,2) NOT NULL,
        current_weight_kg NUMERIC(5,2) NOT NULL,
        target_weight_kg NUMERIC(5,2) NOT NULL,
        target_timeline_months INTEGER NOT NULL,
        activity_level VARCHAR(32) NOT NULL DEFAULT 'moderate',
        goal_type VARCHAR(24) NOT NULL,
        bmi_score NUMERIC(5,2) NOT NULL,
        bmi_category VARCHAR(24) NOT NULL,
        bmr_calories INTEGER NOT NULL,
        maintenance_calories INTEGER NOT NULL,
        daily_calorie_delta INTEGER NOT NULL,
        target_daily_calories INTEGER NOT NULL,
        target_daily_protein_g INTEGER NOT NULL,
        target_daily_carbs_g INTEGER NOT NULL,
        target_daily_fat_g INTEGER NOT NULL,
        timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Jakarta',
        onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS user_api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        encrypted_key TEXT NOT NULL,
        key_hint VARCHAR(32) NOT NULL,
        preferred_model VARCHAR(64) NOT NULL DEFAULT 'gemini-2.5-flash',
        is_valid BOOLEAN NOT NULL DEFAULT TRUE,
        last_verified_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS meal_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        logged_date DATE NOT NULL,
        meal_type VARCHAR(24) NOT NULL,
        source VARCHAR(24) NOT NULL,
        title VARCHAR(160) NOT NULL,
        image_url TEXT,
        ai_notes TEXT,
        total_calories INTEGER NOT NULL,
        total_protein_g NUMERIC(6,2) NOT NULL,
        total_carbs_g NUMERIC(6,2) NOT NULL DEFAULT 0,
        total_fat_g NUMERIC(6,2) NOT NULL DEFAULT 0,
        logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date ON meal_logs(user_id, logged_date);
      CREATE TABLE IF NOT EXISTS meal_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        meal_log_id UUID NOT NULL REFERENCES meal_logs(id) ON DELETE CASCADE,
        food_name VARCHAR(120) NOT NULL,
        weight_grams NUMERIC(7,2) NOT NULL,
        calories INTEGER NOT NULL,
        protein_g NUMERIC(6,2) NOT NULL,
        carbs_g NUMERIC(6,2) NOT NULL DEFAULT 0,
        fat_g NUMERIC(6,2) NOT NULL DEFAULT 0,
        confidence_score NUMERIC(4,2)
      );
      CREATE TABLE IF NOT EXISTS weight_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recorded_date DATE NOT NULL,
        weight_kg NUMERIC(5,2) NOT NULL,
        bmi_score NUMERIC(5,2) NOT NULL,
        notes VARCHAR(240),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS chat_threads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(160) NOT NULL DEFAULT 'Diskusi Nutrisi & Bulking',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        thread_id UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
        role VARCHAR(16) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL UNIQUE,
        p256dh VARCHAR(255) NOT NULL,
        auth VARCHAR(128) NOT NULL,
        reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        breakfast_time VARCHAR(8) NOT NULL DEFAULT '08:00',
        lunch_time VARCHAR(8) NOT NULL DEFAULT '13:00',
        dinner_time VARCHAR(8) NOT NULL DEFAULT '20:00',
        last_breakfast_notified DATE,
        last_lunch_notified DATE,
        last_dinner_notified DATE,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    dbAvailable = true;
  } catch {
    dbAvailable = false;
  }

  return dbAvailable;
}

export const repository = {
  async upsertGoogleUser(input: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
  }): Promise<UserRecord> {
    if (await ensureDatabaseReady()) {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existing[0]) {
        const [updated] = await db
          .update(users)
          .set({
            googleId: input.googleId,
            name: input.name,
            avatarUrl: input.avatarUrl ?? existing[0].avatarUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existing[0].id))
          .returning();
        if (updated) return updated;
      }

      const [created] = await db
        .insert(users)
        .values({
          googleId: input.googleId,
          email: input.email,
          name: input.name,
          avatarUrl: input.avatarUrl ?? null,
        })
        .returning();

      if (created) return created;
    }

    for (const u of memoryStore.users.values()) {
      if (u.email === input.email || u.googleId === input.googleId) {
        u.name = input.name;
        u.avatarUrl = input.avatarUrl ?? u.avatarUrl;
        u.updatedAt = new Date();
        return u;
      }
    }

    const newUser: UserRecord = {
      id: randomUUID(),
      googleId: input.googleId,
      email: input.email,
      name: input.name,
      avatarUrl: input.avatarUrl ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.users.set(newUser.id, newUser);
    return newUser;
  },

  async getUserById(userId: string): Promise<UserRecord | null> {
    if (await ensureDatabaseReady()) {
      const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      return rows[0] ?? null;
    }
    return memoryStore.users.get(userId) ?? null;
  },

  async updateUserName(userId: string, name: string): Promise<void> {
    if (await ensureDatabaseReady()) {
      await db
        .update(users)
        .set({ name, updatedAt: new Date() })
        .where(eq(users.id, userId));
      return;
    }
    const existing = memoryStore.users.get(userId);
    if (existing) {
      existing.name = name;
      existing.updatedAt = new Date();
    }
  },

  async upsertUserProfile(
    userId: string,
    profileData: Omit<UserProfileRecord, "id" | "userId" | "updatedAt">
  ): Promise<UserProfileRecord> {
    if (await ensureDatabaseReady()) {
      const values = {
        userId,
        gender: profileData.gender,
        age: profileData.age,
        heightCm: String(profileData.heightCm),
        currentWeightKg: String(profileData.currentWeightKg),
        targetWeightKg: String(profileData.targetWeightKg),
        targetTimelineMonths: profileData.targetTimelineMonths,
        activityLevel: profileData.activityLevel,
        goalType: profileData.goalType,
        bmiScore: String(profileData.bmiScore),
        bmiCategory: profileData.bmiCategory,
        bmrCalories: profileData.bmrCalories,
        maintenanceCalories: profileData.maintenanceCalories,
        dailyCalorieDelta: profileData.dailyCalorieDelta,
        targetDailyCalories: profileData.targetDailyCalories,
        targetDailyProteinG: profileData.targetDailyProteinG,
        targetDailyCarbsG: profileData.targetDailyCarbsG,
        targetDailyFatG: profileData.targetDailyFatG,
        timezone: profileData.timezone,
        onboardingCompleted: profileData.onboardingCompleted,
        updatedAt: new Date(),
      };

      const existing = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);

      const row = existing[0]
        ? (
            await db
              .update(userProfiles)
              .set(values)
              .where(eq(userProfiles.userId, userId))
              .returning()
          )[0]
        : (await db.insert(userProfiles).values(values).returning())[0];

      if (row) {
        return {
          id: row.id,
          userId: row.userId,
          gender: row.gender as "male" | "female",
          age: row.age,
          heightCm: Number(row.heightCm),
          currentWeightKg: Number(row.currentWeightKg),
          targetWeightKg: Number(row.targetWeightKg),
          targetTimelineMonths: row.targetTimelineMonths,
          activityLevel: row.activityLevel as UserProfileRecord["activityLevel"],
          goalType: row.goalType as UserProfileRecord["goalType"],
          bmiScore: Number(row.bmiScore),
          bmiCategory: row.bmiCategory as UserProfileRecord["bmiCategory"],
          bmrCalories: row.bmrCalories,
          maintenanceCalories: row.maintenanceCalories,
          dailyCalorieDelta: row.dailyCalorieDelta,
          targetDailyCalories: row.targetDailyCalories,
          targetDailyProteinG: row.targetDailyProteinG,
          targetDailyCarbsG: row.targetDailyCarbsG,
          targetDailyFatG: row.targetDailyFatG,
          timezone: row.timezone,
          onboardingCompleted: row.onboardingCompleted,
          updatedAt: row.updatedAt,
        };
      }
    }

    const existing = memoryStore.profiles.get(userId);
    const saved: UserProfileRecord = {
      id: existing?.id ?? randomUUID(),
      userId,
      ...profileData,
      updatedAt: new Date(),
    };
    memoryStore.profiles.set(userId, saved);
    return saved;
  },

  async getUserProfile(userId: string): Promise<UserProfileRecord | null> {
    if (await ensureDatabaseReady()) {
      const rows = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);
      const row = rows[0];
      if (!row) return null;
      return {
        id: row.id,
        userId: row.userId,
        gender: row.gender as "male" | "female",
        age: row.age,
        heightCm: Number(row.heightCm),
        currentWeightKg: Number(row.currentWeightKg),
        targetWeightKg: Number(row.targetWeightKg),
        targetTimelineMonths: row.targetTimelineMonths,
        activityLevel: row.activityLevel as UserProfileRecord["activityLevel"],
        goalType: row.goalType as UserProfileRecord["goalType"],
        bmiScore: Number(row.bmiScore),
        bmiCategory: row.bmiCategory as UserProfileRecord["bmiCategory"],
        bmrCalories: row.bmrCalories,
        maintenanceCalories: row.maintenanceCalories,
        dailyCalorieDelta: row.dailyCalorieDelta,
        targetDailyCalories: row.targetDailyCalories,
        targetDailyProteinG: row.targetDailyProteinG,
        targetDailyCarbsG: row.targetDailyCarbsG,
        targetDailyFatG: row.targetDailyFatG,
        timezone: row.timezone,
        onboardingCompleted: row.onboardingCompleted,
        updatedAt: row.updatedAt,
      };
    }
    return memoryStore.profiles.get(userId) ?? null;
  },

  async upsertUserApiKey(
    userId: string,
    data: { encryptedKey: string; keyHint: string; preferredModel: string; isValid: boolean }
  ): Promise<UserApiKeyRecord> {
    const now = new Date();
    if (await ensureDatabaseReady()) {
      const existing = await db
        .select()
        .from(userApiKeys)
        .where(eq(userApiKeys.userId, userId))
        .limit(1);

      const row = existing[0]
        ? (
            await db
              .update(userApiKeys)
              .set({
                encryptedKey: data.encryptedKey,
                keyHint: data.keyHint,
                preferredModel: data.preferredModel,
                isValid: data.isValid,
                lastVerifiedAt: now,
                updatedAt: now,
              })
              .where(eq(userApiKeys.userId, userId))
              .returning()
          )[0]
        : (
            await db
              .insert(userApiKeys)
              .values({
                userId,
                encryptedKey: data.encryptedKey,
                keyHint: data.keyHint,
                preferredModel: data.preferredModel,
                isValid: data.isValid,
                lastVerifiedAt: now,
                updatedAt: now,
              })
              .returning()
          )[0];

      if (row) return row;
    }

    const existing = memoryStore.apiKeys.get(userId);
    const saved: UserApiKeyRecord = {
      id: existing?.id ?? randomUUID(),
      userId,
      encryptedKey: data.encryptedKey,
      keyHint: data.keyHint,
      preferredModel: data.preferredModel,
      isValid: data.isValid,
      lastVerifiedAt: now,
      updatedAt: now,
    };
    memoryStore.apiKeys.set(userId, saved);
    return saved;
  },

  async getUserApiKey(userId: string): Promise<UserApiKeyRecord | null> {
    if (await ensureDatabaseReady()) {
      const rows = await db
        .select()
        .from(userApiKeys)
        .where(eq(userApiKeys.userId, userId))
        .limit(1);
      return rows[0] ?? null;
    }
    return memoryStore.apiKeys.get(userId) ?? null;
  },

  async deleteUserApiKey(userId: string): Promise<void> {
    if (await ensureDatabaseReady()) {
      await db.delete(userApiKeys).where(eq(userApiKeys.userId, userId));
      return;
    }
    memoryStore.apiKeys.delete(userId);
  },

  async addWeightLog(input: {
    userId: string;
    recordedDate: string;
    weightKg: number;
    bmiScore: number;
    notes?: string;
  }): Promise<WeightLogRecord> {
    if (await ensureDatabaseReady()) {
      const [row] = await db
        .insert(weightLogs)
        .values({
          userId: input.userId,
          recordedDate: input.recordedDate,
          weightKg: String(input.weightKg),
          bmiScore: String(input.bmiScore),
          notes: input.notes ?? null,
        })
        .returning();
      if (row) {
        return {
          id: row.id,
          userId: row.userId,
          recordedDate: row.recordedDate,
          weightKg: Number(row.weightKg),
          bmiScore: Number(row.bmiScore),
          notes: row.notes,
          createdAt: row.createdAt,
        };
      }
    }

    const list = memoryStore.weightLogs.get(input.userId) ?? [];
    const record: WeightLogRecord = {
      id: randomUUID(),
      userId: input.userId,
      recordedDate: input.recordedDate,
      weightKg: input.weightKg,
      bmiScore: input.bmiScore,
      notes: input.notes ?? null,
      createdAt: new Date(),
    };
    list.unshift(record);
    memoryStore.weightLogs.set(input.userId, list);
    return record;
  },

  async getWeightLogs(userId: string): Promise<WeightLogRecord[]> {
    if (await ensureDatabaseReady()) {
      const rows = await db
        .select()
        .from(weightLogs)
        .where(eq(weightLogs.userId, userId))
        .orderBy(desc(weightLogs.recordedDate));
      return rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        recordedDate: r.recordedDate,
        weightKg: Number(r.weightKg),
        bmiScore: Number(r.bmiScore),
        notes: r.notes,
        createdAt: r.createdAt,
      }));
    }
    return memoryStore.weightLogs.get(userId) ?? [];
  },

  async createMealLog(
    userId: string,
    input: {
      loggedDate: string;
      mealType: "breakfast" | "lunch" | "dinner" | "snack";
      source: "ai_scan" | "manual";
      title: string;
      imageUrl?: string | null;
      aiNotes?: string | null;
      items: Array<{
        foodName: string;
        weightGrams: number;
        calories: number;
        proteinG: number;
        carbsG: number;
        fatG: number;
        confidence?: number;
      }>;
    }
  ): Promise<MealLogRecord> {
    const totalCalories = Math.round(
      input.items.reduce((acc, item) => acc + item.calories, 0)
    );
    const totalProteinG = Number(
      input.items.reduce((acc, item) => acc + item.proteinG, 0).toFixed(1)
    );
    const totalCarbsG = Number(
      input.items.reduce((acc, item) => acc + item.carbsG, 0).toFixed(1)
    );
    const totalFatG = Number(
      input.items.reduce((acc, item) => acc + item.fatG, 0).toFixed(1)
    );

    if (await ensureDatabaseReady()) {
      const [createdMeal] = await db
        .insert(mealLogs)
        .values({
          userId,
          loggedDate: input.loggedDate,
          mealType: input.mealType,
          source: input.source,
          title: input.title,
          imageUrl: input.imageUrl ?? null,
          aiNotes: input.aiNotes ?? null,
          totalCalories,
          totalProteinG: String(totalProteinG),
          totalCarbsG: String(totalCarbsG),
          totalFatG: String(totalFatG),
        })
        .returning();

      if (createdMeal) {
        const insertedItems = await db
          .insert(mealItems)
          .values(
            input.items.map((it) => ({
              mealLogId: createdMeal.id,
              foodName: it.foodName,
              weightGrams: String(it.weightGrams),
              calories: Math.round(it.calories),
              proteinG: String(it.proteinG),
              carbsG: String(it.carbsG),
              fatG: String(it.fatG),
              confidenceScore:
                it.confidence !== undefined ? String(it.confidence) : null,
            }))
          )
          .returning();

        return {
          id: createdMeal.id,
          userId: createdMeal.userId,
          loggedDate: createdMeal.loggedDate,
          mealType: createdMeal.mealType as MealLogRecord["mealType"],
          source: createdMeal.source as MealLogRecord["source"],
          title: createdMeal.title,
          imageUrl: createdMeal.imageUrl,
          aiNotes: createdMeal.aiNotes,
          totalCalories: createdMeal.totalCalories,
          totalProteinG: Number(createdMeal.totalProteinG),
          totalCarbsG: Number(createdMeal.totalCarbsG),
          totalFatG: Number(createdMeal.totalFatG),
          loggedAt: createdMeal.loggedAt,
          items: insertedItems.map((it) => ({
            id: it.id,
            mealLogId: it.mealLogId,
            foodName: it.foodName,
            weightGrams: Number(it.weightGrams),
            calories: it.calories,
            proteinG: Number(it.proteinG),
            carbsG: Number(it.carbsG),
            fatG: Number(it.fatG),
            confidenceScore:
              it.confidenceScore !== null ? Number(it.confidenceScore) : null,
          })),
        };
      }
    }

    const mealLogId = randomUUID();
    const record: MealLogRecord = {
      id: mealLogId,
      userId,
      loggedDate: input.loggedDate,
      mealType: input.mealType,
      source: input.source,
      title: input.title,
      imageUrl: input.imageUrl ?? null,
      aiNotes: input.aiNotes ?? null,
      totalCalories,
      totalProteinG,
      totalCarbsG,
      totalFatG,
      loggedAt: new Date(),
      items: input.items.map((it) => ({
        id: randomUUID(),
        mealLogId,
        foodName: it.foodName,
        weightGrams: it.weightGrams,
        calories: Math.round(it.calories),
        proteinG: it.proteinG,
        carbsG: it.carbsG,
        fatG: it.fatG,
        confidenceScore: it.confidence ?? null,
      })),
    };
    memoryStore.mealLogs.set(record.id, record);
    return record;
  },

  async getDailyMealLogs(userId: string, loggedDate: string): Promise<MealLogRecord[]> {
    if (await ensureDatabaseReady()) {
      const logs = await db
        .select()
        .from(mealLogs)
        .where(and(eq(mealLogs.userId, userId), eq(mealLogs.loggedDate, loggedDate)))
        .orderBy(asc(mealLogs.loggedAt));

      const results: MealLogRecord[] = [];
      for (const log of logs) {
        const items = await db
          .select()
          .from(mealItems)
          .where(eq(mealItems.mealLogId, log.id));
        results.push({
          id: log.id,
          userId: log.userId,
          loggedDate: log.loggedDate,
          mealType: log.mealType as MealLogRecord["mealType"],
          source: log.source as MealLogRecord["source"],
          title: log.title,
          imageUrl: log.imageUrl,
          aiNotes: log.aiNotes,
          totalCalories: log.totalCalories,
          totalProteinG: Number(log.totalProteinG),
          totalCarbsG: Number(log.totalCarbsG),
          totalFatG: Number(log.totalFatG),
          loggedAt: log.loggedAt,
          items: items.map((it) => ({
            id: it.id,
            mealLogId: it.mealLogId,
            foodName: it.foodName,
            weightGrams: Number(it.weightGrams),
            calories: it.calories,
            proteinG: Number(it.proteinG),
            carbsG: Number(it.carbsG),
            fatG: Number(it.fatG),
            confidenceScore:
              it.confidenceScore !== null ? Number(it.confidenceScore) : null,
          })),
        });
      }
      return results;
    }

    return Array.from(memoryStore.mealLogs.values()).filter(
      (log) => log.userId === userId && log.loggedDate === loggedDate
    );
  },

  async getAllUserMealLogs(userId: string): Promise<MealLogRecord[]> {
    if (await ensureDatabaseReady()) {
      const logs = await db
        .select()
        .from(mealLogs)
        .where(eq(mealLogs.userId, userId))
        .orderBy(desc(mealLogs.loggedDate));

      return logs.map((log) => ({
        id: log.id,
        userId: log.userId,
        loggedDate: log.loggedDate,
        mealType: log.mealType as MealLogRecord["mealType"],
        source: log.source as MealLogRecord["source"],
        title: log.title,
        imageUrl: log.imageUrl,
        aiNotes: log.aiNotes,
        totalCalories: log.totalCalories,
        totalProteinG: Number(log.totalProteinG),
        totalCarbsG: Number(log.totalCarbsG),
        totalFatG: Number(log.totalFatG),
        loggedAt: log.loggedAt,
        items: [],
      }));
    }

    return Array.from(memoryStore.mealLogs.values()).filter(
      (log) => log.userId === userId
    );
  },

  async deleteMealLog(userId: string, mealLogId: string): Promise<boolean> {
    if (await ensureDatabaseReady()) {
      const deleted = await db
        .delete(mealLogs)
        .where(and(eq(mealLogs.id, mealLogId), eq(mealLogs.userId, userId)))
        .returning();
      return deleted.length > 0;
    }

    const existing = memoryStore.mealLogs.get(mealLogId);
    if (!existing || existing.userId !== userId) {
      return false;
    }
    memoryStore.mealLogs.delete(mealLogId);
    return true;
  },

  async getChatHistory(userId: string): Promise<ChatMessageRecord[]> {
    if (await ensureDatabaseReady()) {
      const threads = await db
        .select()
        .from(chatThreads)
        .where(eq(chatThreads.userId, userId))
        .limit(1);
      const thread = threads[0];
      if (!thread) return [];

      const msgs = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.threadId, thread.id))
        .orderBy(asc(chatMessages.createdAt));

      return msgs.map((m) => ({
        id: m.id,
        threadId: m.threadId,
        role: m.role as "user" | "assistant",
        content: m.content,
        createdAt: m.createdAt,
      }));
    }

    return memoryStore.chatMessages.get(userId) ?? [];
  },

  async appendChatMessages(
    userId: string,
    userMessage: string,
    assistantMessage: string
  ): Promise<ChatMessageRecord[]> {
    if (await ensureDatabaseReady()) {
      let [thread] = await db
        .select()
        .from(chatThreads)
        .where(eq(chatThreads.userId, userId))
        .limit(1);

      if (!thread) {
        [thread] = await db
          .insert(chatThreads)
          .values({ userId, title: "Diskusi Nutrisi & Bulking" })
          .returning();
      }

      if (thread) {
        await db.insert(chatMessages).values([
          { threadId: thread.id, role: "user", content: userMessage },
          { threadId: thread.id, role: "assistant", content: assistantMessage },
        ]);
        return this.getChatHistory(userId);
      }
    }

    const list = memoryStore.chatMessages.get(userId) ?? [];
    const threadId = userId;
    list.push(
      {
        id: randomUUID(),
        threadId,
        role: "user",
        content: userMessage,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        threadId,
        role: "assistant",
        content: assistantMessage,
        createdAt: new Date(),
      }
    );
    memoryStore.chatMessages.set(userId, list);
    return list;
  },

  async clearChatHistory(userId: string): Promise<void> {
    if (await ensureDatabaseReady()) {
      await db.delete(chatThreads).where(eq(chatThreads.userId, userId));
      return;
    }
    memoryStore.chatMessages.delete(userId);
  },

  async upsertPushSubscription(
    userId: string,
    input: {
      endpoint: string;
      p256dh: string;
      auth: string;
      reminderEnabled: boolean;
      breakfastTime: string;
      lunchTime: string;
      dinnerTime: string;
    }
  ): Promise<PushSubscriptionRecord> {
    if (await ensureDatabaseReady()) {
      const existing = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, input.endpoint))
        .limit(1);

      const values = {
        userId,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        reminderEnabled: input.reminderEnabled,
        breakfastTime: input.breakfastTime,
        lunchTime: input.lunchTime,
        dinnerTime: input.dinnerTime,
        updatedAt: new Date(),
      };

      const row = existing[0]
        ? (
            await db
              .update(pushSubscriptions)
              .set(values)
              .where(eq(pushSubscriptions.id, existing[0].id))
              .returning()
          )[0]
        : (await db.insert(pushSubscriptions).values(values).returning())[0];

      if (row) return row;
    }

    const saved: PushSubscriptionRecord = {
      id: randomUUID(),
      userId,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      reminderEnabled: input.reminderEnabled,
      breakfastTime: input.breakfastTime,
      lunchTime: input.lunchTime,
      dinnerTime: input.dinnerTime,
      lastBreakfastNotified: null,
      lastLunchNotified: null,
      lastDinnerNotified: null,
      updatedAt: new Date(),
    };
    memoryStore.pushSubscriptions.set(userId, saved);
    return saved;
  },

  async getUserPushSubscription(userId: string): Promise<PushSubscriptionRecord | null> {
    if (await ensureDatabaseReady()) {
      const rows = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, userId))
        .limit(1);
      return rows[0] ?? null;
    }
    return memoryStore.pushSubscriptions.get(userId) ?? null;
  },

  async updatePushPreferences(
    userId: string,
    prefs: {
      reminderEnabled: boolean;
      breakfastTime: string;
      lunchTime: string;
      dinnerTime: string;
    }
  ): Promise<PushSubscriptionRecord | null> {
    if (await ensureDatabaseReady()) {
      const [row] = await db
        .update(pushSubscriptions)
        .set({
          reminderEnabled: prefs.reminderEnabled,
          breakfastTime: prefs.breakfastTime,
          lunchTime: prefs.lunchTime,
          dinnerTime: prefs.dinnerTime,
          updatedAt: new Date(),
        })
        .where(eq(pushSubscriptions.userId, userId))
        .returning();
      return row ?? null;
    }

    const existing = memoryStore.pushSubscriptions.get(userId);
    if (!existing) return null;
    existing.reminderEnabled = prefs.reminderEnabled;
    existing.breakfastTime = prefs.breakfastTime;
    existing.lunchTime = prefs.lunchTime;
    existing.dinnerTime = prefs.dinnerTime;
    existing.updatedAt = new Date();
    return existing;
  },

  async getAllActivePushSubscriptions(): Promise<PushSubscriptionRecord[]> {
    if (await ensureDatabaseReady()) {
      return db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.reminderEnabled, true));
    }
    return Array.from(memoryStore.pushSubscriptions.values()).filter(
      (s) => s.reminderEnabled
    );
  },
};

