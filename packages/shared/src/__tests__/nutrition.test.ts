import { describe, expect, it } from "vitest";
import {
  calculateBmi,
  calculateBmr,
  calculateNutritionPlan,
  calculateTdee,
  evaluateDailySurplusDeficitStatus,
  onboardingInputSchema,
} from "../index.js";

describe("@nutrisnap/shared — Nutrition Calculation Engine", () => {
  it("calculates BMI score and category accurately", () => {
    const underweight = calculateBmi(50, 175);
    expect(underweight.bmiScore).toBe(16.33);
    expect(underweight.bmiCategory).toBe("underweight");

    const normal = calculateBmi(65, 172);
    expect(normal.bmiScore).toBe(21.97);
    expect(normal.bmiCategory).toBe("normal");

    const overweight = calculateBmi(82, 170);
    expect(overweight.bmiScore).toBe(28.37);
    expect(overweight.bmiCategory).toBe("overweight");
  });

  it("calculates BMR using Mifflin-St Jeor equation for male and female", () => {
    const maleBmr = calculateBmr({
      gender: "male",
      weightKg: 60,
      heightCm: 170,
      age: 22,
    });
    // 10*60 + 6.25*170 - 5*22 + 5 = 600 + 1062.5 - 110 + 5 = 1558
    expect(maleBmr).toBe(1558);

    const femaleBmr = calculateBmr({
      gender: "female",
      weightKg: 60,
      heightCm: 160,
      age: 25,
    });
    // 10*60 + 6.25*160 - 5*25 - 161 = 600 + 1000 - 125 - 161 = 1314
    expect(femaleBmr).toBe(1314);
  });

  it("calculates TDEE and Bulking Surplus Plan accurately", () => {
    const plan = calculateNutritionPlan({
      gender: "male",
      age: 22,
      heightCm: 172,
      currentWeightKg: 58.5,
      targetWeightKg: 66.0,
      targetTimelineMonths: 5,
      activityLevel: "moderate",
    });

    expect(plan.goalType).toBe("bulking");
    expect(plan.bmrCalories).toBe(1555);
    expect(plan.maintenanceCalories).toBe(calculateTdee(1555, "moderate"));
    expect(plan.dailyCalorieDelta).toBeGreaterThan(0);
    expect(plan.targetDailyCalories).toBe(plan.maintenanceCalories + plan.dailyCalorieDelta);
    expect(plan.targetDailyProteinG).toBe(117); // 58.5 * 2.0
    expect(plan.isExtremeTimeline).toBe(false);
  });

  it("triggers health safety guardrail when cutting timeline is too extreme", () => {
    const extremeCut = calculateNutritionPlan({
      gender: "female",
      age: 27,
      heightCm: 162,
      currentWeightKg: 75,
      targetWeightKg: 55,
      targetTimelineMonths: 1, // -20 kg in 1 month is extreme
      activityLevel: "light",
    });

    expect(extremeCut.goalType).toBe("cutting");
    expect(extremeCut.isExtremeTimeline).toBe(true);
    expect(extremeCut.healthWarningMessage).toBeTruthy();
    expect(extremeCut.targetDailyCalories).toBeGreaterThanOrEqual(1200);
  });

  it("evaluates daily surplus and deficit zones accurately", () => {
    const status = evaluateDailySurplusDeficitStatus({
      consumedCalories: 2550,
      consumedProteinG: 95,
      maintenanceCalories: 2400,
      targetDailyCalories: 2800,
      targetDailyProteinG: 120,
      goalType: "bulking",
    });

    expect(status.zone).toBe("in_surplus_zone");
    expect(status.caloriesVsMaintenance).toBe(150);
    expect(status.caloriesRemainingToTarget).toBe(250);
    expect(status.proteinRemainingG).toBe(25);
  });

  it("validates onboarding input schema with Zod", () => {
    const parsed = onboardingInputSchema.safeParse({
      name: "Raka Pratama",
      gender: "male",
      age: "22",
      heightCm: "172",
      currentWeightKg: "58.5",
      targetWeightKg: "66",
      targetTimelineMonths: "6",
      activityLevel: "moderate",
    });

    expect(parsed.success).toBe(true);
  });
});

