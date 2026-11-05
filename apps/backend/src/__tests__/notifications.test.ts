import { describe, expect, it } from "vitest";
import { buildApp } from "../app.js";

describe("Notifications & Scheduled Meal Reminder Endpoints (NS-502)", () => {
  it("supports VAPID public key, push subscription, preferences update, and unlogged meal detection", async () => {
    const app = await buildApp();

    // 1. Get VAPID public key (public endpoint)
    const vapidRes = await app.inject({
      method: "GET",
      url: "/api/v1/notifications/vapid-public-key",
    });
    expect(vapidRes.statusCode).toBe(200);
    expect(vapidRes.json().data.publicKey).toBeTruthy();

    // 2. Login via Google OAuth token endpoint
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/google/token",
      payload: {
        googleId: "google-push-test-001",
        email: "push.user@nutrisnap.local",
        name: "Push Reminder Tester",
      },
    });
    const token = loginRes.json().data.token as string;
    const userId = loginRes.json().data.user.id as string;

    // 3. Subscribe push notification
    const subscribeRes = await app.inject({
      method: "POST",
      url: "/api/v1/notifications/subscribe",
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        endpoint: "https://fcm.googleapis.com/fcm/send/demo-push-endpoint-123",
        keys: {
          p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQ",
          auth: "tBHItJI5svbpez7KI4CCXg",
        },
        reminderEnabled: true,
        breakfastTime: "08:00",
        lunchTime: "12:30",
        dinnerTime: "19:30",
      },
    });
    expect(subscribeRes.statusCode).toBe(200);
    expect(subscribeRes.json().data.subscription.reminderEnabled).toBe(true);

    // 4. Update push preferences
    const updatePrefRes = await app.inject({
      method: "PUT",
      url: "/api/v1/notifications/preferences",
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        reminderEnabled: true,
        breakfastTime: "07:30",
        lunchTime: "12:30",
        dinnerTime: "20:00",
      },
    });
    expect(updatePrefRes.statusCode).toBe(200);
    expect(updatePrefRes.json().data.subscription.breakfastTime).toBe("07:30");

    // 5. Trigger test reminder evaluation and verify unlogged meals are detected
    const testPushRes = await app.inject({
      method: "POST",
      url: "/api/v1/notifications/test",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    expect(testPushRes.statusCode).toBe(200);
    const evaluation = testPushRes.json().data.reminderEvaluation;
    expect(evaluation.checkedSubscriptions).toBeGreaterThanOrEqual(1);
    const detectedForUser = evaluation.unloggedMealsDetected.find(
      (u: { userId: string }) => u.userId === userId
    );
    expect(detectedForUser).toBeDefined();
    expect(detectedForUser.missingMealTypes).toEqual([
      "breakfast",
      "lunch",
      "dinner",
    ]);

    await app.close();
  });
});
