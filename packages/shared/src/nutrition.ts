export type Gender = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type GoalType = "bulking" | "cutting" | "maintenance";

export type BmiCategory = "underweight" | "normal" | "overweight" | "obese";

export interface BmiResult {
  bmiScore: number;
  bmiCategory: BmiCategory;
}

export interface BmrInput {
  gender: Gender;
  weightKg: number;
  heightCm: number;
  age: number;
}

export interface NutritionPlanInput {
  gender: Gender;
  age: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  targetTimelineMonths: number;
  activityLevel: ActivityLevel;
}

export interface NutritionPlanResult {
  goalType: GoalType;
  bmiScore: number;
  bmiCategory: BmiCategory;
  bmrCalories: number;
  maintenanceCalories: number;
  rawDailyCalorieDelta: number;
  dailyCalorieDelta: number;
  targetDailyCalories: number;
  targetDailyProteinG: number;
  targetDailyCarbsG: number;
  targetDailyFatG: number;
  isExtremeTimeline: boolean;
  healthWarningMessage: string | null;
}

export type DailyEnergyZone =
  | "under_maintenance"
  | "in_surplus_zone"
  | "target_surplus_reached"
  | "on_track_deficit"
  | "over_deficit_limit"
  | "on_track_maintenance";

export interface DailyStatusEvaluation {
  zone: DailyEnergyZone;
  label: string;
  caloriesRemainingToTarget: number;
  caloriesVsMaintenance: number;
  proteinRemainingG: number;
  calorieProgressPercent: number;
  proteinProgressPercent: number;
}

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const KCAL_PER_KG_BODYWEIGHT = 7700;
const DAYS_PER_MONTH = 30.4375;

/**
 * Menghitung skor BMI dan kategorinya sesuai standar WHO.
 */
export function calculateBmi(weightKg: number, heightCm: number): BmiResult {
  const heightMeters = heightCm / 100;
  if (heightMeters <= 0 || weightKg <= 0) {
    throw new Error("Tinggi dan berat badan harus lebih besar dari 0.");
  }

  const rawBmi = weightKg / (heightMeters * heightMeters);
  const bmiScore = Number(rawBmi.toFixed(2));

  let bmiCategory: BmiCategory = "normal";
  if (bmiScore < 18.5) {
    bmiCategory = "underweight";
  } else if (bmiScore < 25.0) {
    bmiCategory = "normal";
  } else if (bmiScore < 30.0) {
    bmiCategory = "overweight";
  } else {
    bmiCategory = "obese";
  }

  return { bmiScore, bmiCategory };
}

/**
 * Menghitung Basal Metabolic Rate (BMR) menggunakan persamaan Mifflin-St Jeor.
 */
export function calculateBmr({ gender, weightKg, heightCm, age }: BmrInput): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const rawBmr = gender === "male" ? base + 5 : base - 161;
  return Math.round(rawBmr);
}

/**
 * Menghitung Total Daily Energy Expenditure (Maintenance Calories / TDEE).
 */
export function calculateTdee(bmrCalories: number, activityLevel: ActivityLevel): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  return Math.round(bmrCalories * multiplier);
}

/**
 * Menghitung rencana nutrisi lengkap (BMI, BMR, TDEE, Surplus/Deficit, Target Kalori & Makronutrisi)
 * dilengkapi dengan Safety Guardrail kesehatan sesuai spesifikasi PRD Section 3.4.
 */
export function calculateNutritionPlan(input: NutritionPlanInput): NutritionPlanResult {
  const { bmiScore, bmiCategory } = calculateBmi(input.currentWeightKg, input.heightCm);
  const bmrCalories = calculateBmr({
    gender: input.gender,
    weightKg: input.currentWeightKg,
    heightCm: input.heightCm,
    age: input.age,
  });
  const maintenanceCalories = calculateTdee(bmrCalories, input.activityLevel);

  const weightDiffKg = input.targetWeightKg - input.currentWeightKg;
  const totalDays = Math.max(1, Math.round(input.targetTimelineMonths * DAYS_PER_MONTH));

  let goalType: GoalType = "maintenance";
  if (weightDiffKg > 0.25) {
    goalType = "bulking";
  } else if (weightDiffKg < -0.25) {
    goalType = "cutting";
  }

  const rawDailyCalorieDelta =
    goalType === "maintenance"
      ? 0
      : Math.round((weightDiffKg * KCAL_PER_KG_BODYWEIGHT) / totalDays);

  let dailyCalorieDelta = rawDailyCalorieDelta;
  let isExtremeTimeline = false;
  let healthWarningMessage: string | null = null;

  if (goalType === "bulking" && rawDailyCalorieDelta > 1000) {
    isExtremeTimeline = true;
    dailyCalorieDelta = 500;
    healthWarningMessage =
      "Target kenaikan berat badan terlalu cepat (> +1000 kcal/hari). Sistem menyesuaikan ke surplus aman (+500 kcal/hari) agar kenaikan fokus pada massa otot.";
  } else if (goalType === "cutting" && rawDailyCalorieDelta < -1000) {
    isExtremeTimeline = true;
    dailyCalorieDelta = -500;
    healthWarningMessage =
      "Target penurunan berat badan terlalu ekstrem (< -1000 kcal/hari). Sistem menyesuaikan ke defisit sehat (-500 kcal/hari) untuk menjaga metabolisme dan massa otot.";
  }

  const minSafeCalories = input.gender === "male" ? 1500 : 1200;
  let targetDailyCalories = maintenanceCalories + dailyCalorieDelta;

  if (targetDailyCalories < minSafeCalories) {
    isExtremeTimeline = true;
    targetDailyCalories = minSafeCalories;
    dailyCalorieDelta = targetDailyCalories - maintenanceCalories;
    healthWarningMessage =
      healthWarningMessage ??
      `Target kalori harian disesuaikan ke batas minimum aman (${minSafeCalories} kcal/hari).`;
  }

  // Perhitungan Target Protein (gram/hari) sesuai PRD 3.4:
  // Bulking: 2.0g/kg | Cutting: 2.1g/kg | Maintenance: 1.6g/kg
  const proteinMultiplier =
    goalType === "bulking" ? 2.0 : goalType === "cutting" ? 2.1 : 1.6;
  const targetDailyProteinG = Math.round(input.currentWeightKg * proteinMultiplier);

  // Perhitungan Lemak (25% dari total kalori harian; 1g lemak = 9 kcal)
  const targetDailyFatG = Math.round((targetDailyCalories * 0.25) / 9);

  // Sisa kalori dialokasikan untuk Karbohidrat (1g karbohidrat = 4 kcal; 1g protein = 4 kcal)
  const remainingCaloriesForCarbs = Math.max(
    0,
    targetDailyCalories - targetDailyProteinG * 4 - targetDailyFatG * 9
  );
  const targetDailyCarbsG = Math.round(remainingCaloriesForCarbs / 4);

  return {
    goalType,
    bmiScore,
    bmiCategory,
    bmrCalories,
    maintenanceCalories,
    rawDailyCalorieDelta,
    dailyCalorieDelta,
    targetDailyCalories,
    targetDailyProteinG,
    targetDailyCarbsG,
    targetDailyFatG,
    isExtremeTimeline,
    healthWarningMessage,
  };
}

/**
 * Mengevaluasi status Surplus / Deficit harian secara real-time untuk Dashboard.
 */
export function evaluateDailySurplusDeficitStatus(params: {
  consumedCalories: number;
  consumedProteinG: number;
  maintenanceCalories: number;
  targetDailyCalories: number;
  targetDailyProteinG: number;
  goalType: GoalType;
}): DailyStatusEvaluation {
  const {
    consumedCalories,
    consumedProteinG,
    maintenanceCalories,
    targetDailyCalories,
    targetDailyProteinG,
    goalType,
  } = params;

  const caloriesRemainingToTarget = targetDailyCalories - consumedCalories;
  const caloriesVsMaintenance = consumedCalories - maintenanceCalories;
  const proteinRemainingG = Math.max(0, Math.round(targetDailyProteinG - consumedProteinG));

  const calorieProgressPercent =
    targetDailyCalories > 0
      ? Math.min(100, Math.round((consumedCalories / targetDailyCalories) * 100))
      : 0;
  const proteinProgressPercent =
    targetDailyProteinG > 0
      ? Math.min(100, Math.round((consumedProteinG / targetDailyProteinG) * 100))
      : 0;

  let zone: DailyEnergyZone = "on_track_maintenance";
  let label = "Dalam Zona Pemeliharaan (Maintenance)";

  if (goalType === "bulking") {
    if (consumedCalories < maintenanceCalories) {
      zone = "under_maintenance";
      label = `Di Bawah Maintenance (${Math.abs(caloriesVsMaintenance)} kcal lagi menuju TDEE)`;
    } else if (consumedCalories < targetDailyCalories) {
      zone = "in_surplus_zone";
      label = `Zona Surplus (+${caloriesVsMaintenance} kcal di atas TDEE)`;
    } else {
      zone = "target_surplus_reached";
      label = `Target Surplus Bulking Tercapai (+${caloriesVsMaintenance} kcal)`;
    }
  } else if (goalType === "cutting") {
    if (consumedCalories <= targetDailyCalories) {
      zone = "on_track_deficit";
      label = `Zona Defisit Aman (${caloriesRemainingToTarget} kcal tersisa hari ini)`;
    } else {
      zone = "over_deficit_limit";
      label = `Melewati Target Defisit (+${Math.abs(caloriesRemainingToTarget)} kcal di atas target)`;
    }
  } else {
    const diff = Math.abs(consumedCalories - targetDailyCalories);
    label =
      diff <= 150
        ? "Target Maintenance Tercapai"
        : `${caloriesRemainingToTarget > 0 ? caloriesRemainingToTarget : 0} kcal tersisa`;
  }

  return {
    zone,
    label,
    caloriesRemainingToTarget,
    caloriesVsMaintenance,
    proteinRemainingG,
    calorieProgressPercent,
    proteinProgressPercent,
  };
}

