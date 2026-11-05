import {
  pushSubscriptionInputSchema,
  updatePushPreferencesSchema,
} from "@nutrisnap/shared";
import type { FastifyInstance } from "fastify";
import { env } from "../../config/env.js";
import { repository } from "../../db/repository.js";
import { evaluateAndSendUnloggedMealReminders } from "../../jobs/meal-reminder.job.js";
import { requireAuthenticatedUser } from "../auth/session.js";

export async function registerNotificationRoutes(
  app: FastifyInstance
): Promise<void> {
  // 1. GET /api/v1/notifications/vapid-public-key
  app.get("/api/v1/notifications/vapid-public-key", async () => {
    return {
      success: true,
      data: {
        publicKey:
          env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ??
          "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U",
      },
      meta: { timestamp: new Date().toISOString() },
    };
  });

  // 2. GET /api/v1/notifications/preferences
  app.get("/api/v1/notifications/preferences", async (request, reply) => {
    const user = await requireAuthenticatedUser(request, reply);
    if (!user) return;

    const subscription = await repository.getUserPushSubscription(user.id);
    return {
      success: true,
      data: { subscription },
      meta: { timestamp: new Date().toISOString() },
    };
  });

  // 3. POST /api/v1/notifications/subscribe
  app.post("/api/v1/notifications/subscribe", async (request, reply) => {
    const user = await requireAuthenticatedUser(request, reply);
    if (!user) return;

    const payload = pushSubscriptionInputSchema.parse(request.body);
    const saved = await repository.upsertPushSubscription(user.id, {
      endpoint: payload.endpoint,
      p256dh: payload.keys.p256dh,
      auth: payload.keys.auth,
      reminderEnabled: payload.reminderEnabled,
      breakfastTime: payload.breakfastTime,
      lunchTime: payload.lunchTime,
      dinnerTime: payload.dinnerTime,
    });

    return {
      success: true,
      data: { subscription: saved },
      meta: { timestamp: new Date().toISOString() },
    };
  });

  // 4. PUT /api/v1/notifications/preferences
  app.put("/api/v1/notifications/preferences", async (request, reply) => {
    const user = await requireAuthenticatedUser(request, reply);
    if (!user) return;

    const payload = updatePushPreferencesSchema.parse(request.body);
    const updated = await repository.updatePushPreferences(user.id, payload);

    return {
      success: true,
      data: { subscription: updated },
      meta: { timestamp: new Date().toISOString() },
    };
  });

  // 5. POST /api/v1/notifications/test
  app.post("/api/v1/notifications/test", async (request, reply) => {
    const user = await requireAuthenticatedUser(request, reply);
    if (!user) return;

    const result = await evaluateAndSendUnloggedMealReminders();
    return {
      success: true,
      data: {
        message: "Pengingat makan harian siap dikirim ke perangkat Anda!",
        reminderEvaluation: result,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  });
}

