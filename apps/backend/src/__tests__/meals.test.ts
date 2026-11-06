import { describe, expect, it } from "vitest";
import { buildApp } from "../app.js";

describe("@nutrisnap/backend — Dual Nutrition Logging (AI Vision & Manual CRUD) [NS-202..NS-204]", () => {
  it("scans food photo via Gemini Vision (with BYOK), logs meals, and aggregates daily totals", async () => {
    const app = await buildApp();

    const loginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/google/token",
      payload: {
        googleId: "google-meals-user-01",
        email: "meals@nutrisnap.app",
        name: "Dimas Lifter",
      },
    });
    const token = loginRes.json().data.token as string;

    // 1. Set BYOK Gemini API Key
    await app.inject({
      method: "PUT",
      url: "/api/v1/apikey",
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        apiKey: "AIzaSyTest-MealsScannerKey-1122334455",
        preferredModel: "gemini-2.5-flash",
      },
    });

    // 2. Scan Photo (/api/v1/meals/scan-photo)
    const scanRes = await app.inject({
      method: "POST",
      url: "/api/v1/meals/scan-photo",
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        imageBase64:
          "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoCAAIAAQAcJaQAA3AA/v3AgAA=",
        mealType: "lunch",
        userContextNote: "Nasi ayam bakar dada",
      },
    });
    expect(scanRes.statusCode).toBe(200);
    const scanData = scanRes.json().data;
    expect(scanData.items.length).toBeGreaterThanOrEqual(2);
    expect(scanData.totals.proteinG).toBeGreaterThan(40);

    // 3. Estimate Manual (/api/v1/meals/estimate-manual)
    const manualEstRes = await app.inject({
      method: "POST",
      url: "/api/v1/meals/estimate-manual",
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        foodName: "Telur Ayam Rebus Utuh",
        weightGrams: 120,
      },
    });
    expect(manualEstRes.statusCode).toBe(200);
    expect(manualEstRes.json().data.calories).toBe(186);

    // 4. Commit Meal Log (/api/v1/meals)
    const createMealRes = await app.inject({
      method: "POST",
      url: "/api/v1/meals",
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        loggedDate: "2026-11-06",
        mealType: "lunch",
        source: "ai_scan",
        title: scanData.mealTitle,
        aiNotes: scanData.nutritionNotes,
        items: scanData.items,
      },
    });
    expect(createMealRes.statusCode).toBe(201);
    const mealLogId = createMealRes.json().data.mealLog.id as string;

    // 5. Get Daily Summary (/api/v1/meals/daily?date=2026-11-06)
    const dailyRes = await app.inject({
      method: "GET",
      url: "/api/v1/meals/daily?date=2026-11-06",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(dailyRes.statusCode).toBe(200);
    const dailyData = dailyRes.json().data;
    expect(dailyData.totals.calories).toBe(597);
    expect(dailyData.meals).toHaveLength(1);

    // 5b. Update Meal Log (/api/v1/meals/:id)
    const patchRes = await app.inject({
      method: "PATCH",
      url: `/api/v1/meals/${mealLogId}`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        title: "Makan Siang Dada Ayam Bakar Spesial",
      },
    });
    expect(patchRes.statusCode).toBe(200);
    expect(patchRes.json().data.meal.title).toBe("Makan Siang Dada Ayam Bakar Spesial");

    // 6. Delete Meal Log (/api/v1/meals/:id)
    const delRes = await app.inject({
      method: "DELETE",
      url: `/api/v1/meals/${mealLogId}`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(delRes.statusCode).toBe(200);

    await app.close();
  });
});

