import { type Schema, Type } from "@google/genai";
import { env } from "../../config/env.js";
import { estimateMacrosFromLocalCatalog } from "../../db/seed-foods.js";
import { getDecryptedUserGeminiClient } from "../apikey/apikey.routes.js";

const manualMacroSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    foodName: { type: Type.STRING },
    weightGrams: { type: Type.NUMBER },
    calories: { type: Type.INTEGER },
    proteinG: { type: Type.NUMBER },
    carbsG: { type: Type.NUMBER },
    fatG: { type: Type.NUMBER },
  },
  required: ["foodName", "weightGrams", "calories", "proteinG", "carbsG", "fatG"],
};

export async function estimateManualFoodMacros(params: {
  userId?: string;
  foodName: string;
  weightGrams: number;
}): Promise<{
  foodName: string;
  weightGrams: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: "local_db" | "gemini_ai" | "heuristic_fallback";
}> {
  // 1. Cek katalog makanan lokal Indonesia & fitness terlebih dahulu (< 1ms)
  const localMatch = estimateMacrosFromLocalCatalog(
    params.foodName,
    params.weightGrams
  );
  if (localMatch) {
    return localMatch;
  }

  // 2. Jika tidak ada di katalog lokal dan user memiliki BYOK Gemini Key, gunakan Gemini AI
  if (params.userId && env.NODE_ENV !== "test") {
    const clientBundle = await getDecryptedUserGeminiClient(params.userId);
    if (clientBundle) {
      try {
        const response = await clientBundle.ai.models.generateContent({
          model: clientBundle.model,
          contents: `Hitung estimasi kalori (kcal), protein (g), karbohidrat (g), dan lemak (g) untuk makanan "${params.foodName}" dengan berat ${params.weightGrams} gram.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: manualMacroSchema,
            temperature: 0.1,
          },
        });
        if (response.text) {
          const parsed = JSON.parse(response.text) as {
            foodName: string;
            weightGrams: number;
            calories: number;
            proteinG: number;
            carbsG: number;
            fatG: number;
          };
          return {
            ...parsed,
            source: "gemini_ai",
          };
        }
      } catch {
        // Lanjut ke heuristic fallback jika kuota habis
      }
    }
  }

  // 3. Heuristic Fallback proporsional terhadap gramasi
  const ratio = params.weightGrams / 100;
  return {
    foodName: params.foodName.trim(),
    weightGrams: params.weightGrams,
    calories: Math.round(165 * ratio),
    proteinG: Number((12.0 * ratio).toFixed(1)),
    carbsG: Number((18.0 * ratio).toFixed(1)),
    fatG: Number((5.0 * ratio).toFixed(1)),
    source: "heuristic_fallback",
  };
}
