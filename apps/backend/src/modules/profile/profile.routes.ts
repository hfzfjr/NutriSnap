import {
  calculateBmi,
  calculateNutritionPlan,
  createWeightLogSchema,
  onboardingInputSchema,
} from "@nutrisnap/shared";
import type { FastifyInstance } from "fastify";
import { repository } from "../../db/repository.js";
import { requireAuthenticatedUser } from "../auth/session.js";

export async function registerProfileRoutes(app: FastifyInstance): Promise<void> {
  // 1. POST /api/v1/profile/onboarding
  app.post("/api/v1/profile/onboarding", async (request, reply) => {
    const user = await requireAuthenticatedUser(request, reply);
    if (!user) return;

    const payload = onboardingInputSchema.parse(request.body);
    await repository.updateUserName(user.id, payload.name);

    const plan = calculateNutritionPlan({
      gender: payload.gender,
      age: payload.age,
      heightCm: payload.heightCm,
      currentWeightKg: payload.currentWeightKg,
      targetWeightKg: payload.targetWeightKg,
      targetTimelineMonths: payload.targetTimelineMonths,
      activityLevel: payload.activityLevel,
    });

    const profile = await repository.upsertUserProfile(user.id, {
      gender: payload.gender,
      age: payload.age,
      heightCm: payload.heightCm,
      currentWeightKg: payload.currentWeightKg,
      targetWeightKg: payload.targetWeightKg,
      targetTimelineMonths: payload.targetTimelineMonths,
      activityLevel: payload.activityLevel,
      goalType: plan.goalType,
      bmiScore: plan.bmiScore,
      bmiCategory: plan.bmiCategory,
      bmrCalories: plan.bmrCalories,
      maintenanceCalories: plan.maintenanceCalories,
      dailyCalorieDelta: plan.dailyCalorieDelta,
      targetDailyCalories: plan.targetDailyCalories,
      targetDailyProteinG: plan.targetDailyProteinG,
      targetDailyCarbsG: plan.targetDailyCarbsG,
      targetDailyFatG: plan.targetDailyFatG,
      timezone: payload.timezone,
      onboardingCompleted: true,
    });

    const todayStr = new Date().toISOString().slice(0, 10);
    await repository.addWeightLog({
      userId: user.id,
      recordedDate: todayStr,
      weightKg: payload.currentWeightKg,
      bmiScore: plan.bmiScore,
      notes: "Berat awal saat Onboarding",
    });

    return {
      success: true,
      data: {
        profile,
        healthWarningMessage: plan.healthWarningMessage,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  });

  // 2. GET /api/v1/profile
  app.get("/api/v1/profile", async (request, reply) => {
    const user = await requireAuthenticatedUser(request, reply);
    if (!user) return;

    const profile = await repository.getUserProfile(user.id);
    const weightLogs = await repository.getWeightLogs(user.id);

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
        profile,
        weightLogs,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  });

  // 3. POST /api/v1/profile/weight
  app.post("/api/v1/profile/weight", async (request, reply) => {
    const user = await requireAuthenticatedUser(request, reply);
    if (!user) return;

    const payload = createWeightLogSchema.parse(request.body);
    const profile = await repository.getUserProfile(user.id);
    const heightCm = profile?.heightCm ?? 170;
    const { bmiScore, bmiCategory } = calculateBmi(payload.weightKg, heightCm);

    const logEntry = await repository.addWeightLog({
      userId: user.id,
      recordedDate: payload.recordedDate,
      weightKg: payload.weightKg,
      bmiScore,
      notes: payload.notes,
    });

    if (profile) {
      const updatedPlan = calculateNutritionPlan({
        gender: profile.gender,
        age: profile.age,
        heightCm: profile.heightCm,
        currentWeightKg: payload.weightKg,
        targetWeightKg: profile.targetWeightKg,
        targetTimelineMonths: profile.targetTimelineMonths,
        activityLevel: profile.activityLevel,
      });

      await repository.upsertUserProfile(user.id, {
        ...profile,
        currentWeightKg: payload.weightKg,
        bmiScore,
        bmiCategory,
        bmrCalories: updatedPlan.bmrCalories,
        maintenanceCalories: updatedPlan.maintenanceCalories,
        dailyCalorieDelta: updatedPlan.dailyCalorieDelta,
        targetDailyCalories: updatedPlan.targetDailyCalories,
        targetDailyProteinG: updatedPlan.targetDailyProteinG,
        targetDailyCarbsG: updatedPlan.targetDailyCarbsG,
        targetDailyFatG: updatedPlan.targetDailyFatG,
      });
    }

    return {
      success: true,
      data: {
        weightLog: logEntry,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  });

  // 3b. DELETE /api/v1/profile/weight/:id
  app.delete("/api/v1/profile/weight/:id", async (request, reply) => {
    const user = await requireAuthenticatedUser(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };
    const success = await repository.deleteWeightLog(user.id, id);

    if (!success) {
      return reply.status(404).send({
        success: false,
        error: {
          code: "WEIGHT_LOG_NOT_FOUND",
          message: "Catatan berat badan tidak ditemukan.",
          details: [],
        },
      });
    }

    return {
      success: true,
      data: { id, deleted: true },
      meta: { timestamp: new Date().toISOString() },
    };
  });

  // 4. GET /api/v1/analytics/overview
  app.get("/api/v1/analytics/overview", async (request, reply) => {
    const user = await requireAuthenticatedUser(request, reply);
    if (!user) return;

    const profile = await repository.getUserProfile(user.id);
    const weightLogs = await repository.getWeightLogs(user.id);
    const allMeals = await repository.getAllUserMealLogs(user.id);

    // Kelompokkan total kalori & protein per tanggal (7 hari terakhir)
    const dailyMap = new Map<
      string,
      { date: string; calories: number; proteinG: number }
    >();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      dailyMap.set(dateKey, { date: dateKey, calories: 0, proteinG: 0 });
    }

    for (const meal of allMeals) {
      const existing = dailyMap.get(meal.loggedDate);
      if (existing) {
        existing.calories += meal.totalCalories;
        existing.proteinG = Number(
          (existing.proteinG + meal.totalProteinG).toFixed(1)
        );
      }
    }

    return {
      success: true,
      data: {
        profile,
        weightLogs,
        weeklySummary: Array.from(dailyMap.values()),
      },
      meta: { timestamp: new Date().toISOString() },
    };
  });
}
