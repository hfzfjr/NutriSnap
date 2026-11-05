import { describe, expect, it } from "vitest";
import { buildApp } from "../app.js";

describe("@nutrisnap/backend — Server & Local Food Macro Estimator", () => {
  it("GET /api/v1/health returns standard response envelope", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/health",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("healthy");
    await app.close();
  });

  it("POST /api/v1/meals/estimate-local calculates proportional macros by grams", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/meals/estimate-local",
      payload: {
        foodName: "Dada Ayam Panggang",
        weightGrams: 200,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.calories).toBe(330); // 165 * 2
    expect(body.data.proteinG).toBe(62); // 31 * 2
    await app.close();
  });
});

