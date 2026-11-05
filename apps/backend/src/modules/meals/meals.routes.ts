import {
  createMealLogRequestSchema,
  estimateManualFoodRequestSchema,
  evaluateDailySurplusDeficitStatus,
  scanFoodPhotoRequestSchema,
} from "@nutrisnap/shared";
import type { FastifyInstance } from "fastify";
import { repository } from "../../db/repository.js";
import {
  requireAuthenticatedUser,
  resolveAuthenticatedUser,
} from "../auth/session.js";
import { analyzeFoodPhotoWithGemini } from "./food-vision.service.js";
import { estimateManualFoodMacros } from "./manual-estimator.service.js";

export async function registerMealRoutes(app: FastifyInstance): Promise<void> {
  // 1. POST /api/v1/meals/scan-photo (Gemini Multimodal Food Photo Scanner)
  app.post("/api/v1/meals/scan-photo", async (request, reply) => {
    const user = await requireAuthenticatedUser(request, reply);
    if (!user) return;

    const payload = scanFoodPhotoRequestSchema.parse(request.body);
    const analysis = await analyzeFoodPhotoWithGemini({
      userId: user.id,
      imageBase64: payload.imageBase64,
      mealType: payload.mealType,
      userContextNote: payload.userContextNote,
    });

    return {
      success: true,
      data: analysis,
      meta: { timestamp: new Date().toISOString() },
    };
  });

  // 2. POST /api/v1/meals/estimate-manual (Local DB + Gemini AI Macro Estimator)
  app.post("/api/v1/meals/estimate-manual", async (request) => {
    const user = await resolveAuthenticatedUser(request);
    const payload = estimateManualFoodRequestSchema.parse(request.body);

    const estimated = await estimateManualFoodMacros({
      userId: user?.id,
      foodName: payload.foodName,
      weightGrams: payload.weightGrams,
    });

    return {
      success: true,
      data: estimated,
      meta: { timestamp: new Date().toISOString() },
    };
  });

  // 3. POST /api/v1/meals (Commit & Save Meal Log)
  app.post("/api/v1/meals", async (request, reply) => {
    const user = await requireAuthenticatedUser(request, reply);
    if (!user) return;

    const payload = createMealLogRequestSchema.parse(request.body);
    const created = await repository.createMealLog(user.id, {
      loggedDate: payload.loggedDate,
      mealType: payload.mealType,
      source: payload.source,
      title: payload.title,
      imageUrl: payload.imageUrl ?? null,
      aiNotes: payload.aiNotes ?? null,
      items: payload.items,
    });

    return reply.status(201).send({
      success: true,
      data: { mealLog: created },
      meta: { timestamp: new Date().toISOString() },
    });
  });

  // 4. GET /api/v1/meals/daily?date=YYYY-MM-DD
  app.get("/api/v1/meals/daily", async (request, reply) => {
    const user = await requireAuthenticatedUser(request, reply);
    if (!user) return;

    const query = request.query as { date?: string };
    const dateStr =
      query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date)
        ? query.date
        : new Date().toISOString().slice(0, 10);

    const meals = await repository.getDailyMealLogs(user.id, dateStr);
    const profile = await repository.getUserProfile(user.id);

    const totals = meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.totalCalories,
        proteinG: Number((acc.proteinG + meal.totalProteinG).toFixed(1)),
        carbsG: Number((acc.carbsG + meal.totalCarbsG).toFixed(1)),
        fatG: Number((acc.fatG + meal.totalFatG).toFixed(1)),
      }),
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
    );

    const maintenanceCalories = profile?.maintenanceCalories ?? 2300;
    const targetDailyCalories = profile?.targetDailyCalories ?? 2700;
    const targetDailyProteinG = profile?.targetDailyProteinG ?? 125;
    const goalType = profile?.goalType ?? "bulking";

    const status = evaluateDailySurplusDeficitStatus({
      consumedCalories: totals.calories,
      consumedProteinG: totals.proteinG,
      maintenanceCalories,
      targetDailyCalories,
      targetDailyProteinG,
      goalType,
    });

    return {
      success: true,
      data: {
        date: dateStr,
        meals,
        totals,
        targets: {
          goalType,
          maintenanceCalories,
          targetDailyCalories,
          targetDailyProteinG,
          targetDailyCarbsG: profile?.targetDailyCarbsG ?? 340,
          targetDailyFatG: profile?.targetDailyFatG ?? 75,
          dailyCalorieDelta:
            profile?.dailyCalorieDelta ?? targetDailyCalories - maintenanceCalories,
        },
        status,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  });

  // 5. DELETE /api/v1/meals/:id
  app.delete("/api/v1/meals/:id", async (request, reply) => {
    const user = await requireAuthenticatedUser(request, reply);
    if (!user) return;

    const params = request.params as { id: string };
    const deleted = await repository.deleteMealLog(user.id, params.id);

    if (!deleted) {
      return reply.status(404).send({
        success: false,
        error: {
          code: "MEAL_LOG_NOT_FOUND",
          message: "Catatan makanan tidak ditemukan.",
          details: [],
        },
      });
    }

    return {
      success: true,
      data: { deleted: true, id: params.id },
      meta: { timestamp: new Date().toISOString() },
    };
  });
}

