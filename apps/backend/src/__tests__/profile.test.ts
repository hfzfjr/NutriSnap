import { describe, expect, it } from "vitest";
import { buildApp } from "../app.js";

describe("@nutrisnap/backend — Onboarding & Personalized Nutrition Profile [NS-104]", () => {
  it("calculates and saves onboarding profile + initial weight log", async () => {
    const app = await buildApp();

    const loginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/google/token",
      payload: {
        googleId: "google-onboard-01",
        email: "onboard@nutrisnap.app",
        name: "Raka Bulker",
      },
    });
    const token = loginRes.json().data.token as string;

    const onboardRes = await app.inject({
      method: "POST",
      url: "/api/v1/profile/onboarding",
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        name: "Raka Pratama",
        gender: "male",
        age: 22,
        heightCm: 172,
        currentWeightKg: 58.5,
        targetWeightKg: 66.0,
        targetTimelineMonths: 5,
        activityLevel: "moderate",
        timezone: "Asia/Jakarta",
      },
    });

    expect(onboardRes.statusCode).toBe(200);
    const body = onboardRes.json();
    expect(body.success).toBe(true);
    expect(body.data.profile.goalType).toBe("bulking");
    expect(body.data.profile.onboardingCompleted).toBe(true);
    expect(body.data.profile.targetDailyCalories).toBeGreaterThan(
      body.data.profile.maintenanceCalories
    );

    const profileRes = await app.inject({
      method: "GET",
      url: "/api/v1/profile",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(profileRes.statusCode).toBe(200);
    expect(profileRes.json().data.weightLogs.length).toBeGreaterThanOrEqual(1);

    await app.close();
  });
});

