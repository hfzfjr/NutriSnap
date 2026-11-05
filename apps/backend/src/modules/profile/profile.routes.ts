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
}
