import cron from "node-cron";
import webpush from "web-push";
import { env } from "../config/env.js";
import { repository } from "../db/repository.js";

export const DEFAULT_VAPID_PUBLIC_KEY =
  "BCHJc_YMqf9ypdNJK46fLtv4rJU9W1GfgPz83YWgZZnr-88O_wZ2P-7__ULI_fdhZasOxHSuf6bV9xDoupyb5TY";
export const DEFAULT_VAPID_PRIVATE_KEY =
  "yJuuUEOIacBT_q5RJYdYbll7tL4qVRJ1ANOPtaR2dtM";

let vapidConfigured = false;

export function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true;
  const pubKey = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY;
  const privKey = env.VAPID_PRIVATE_KEY || DEFAULT_VAPID_PRIVATE_KEY;
  try {
    webpush.setVapidDetails(env.VAPID_SUBJECT, pubKey, privKey);
    vapidConfigured = true;
    return true;
  } catch {
    return false;
  }
}

export interface UnloggedMealReminderResult {
  checkedSubscriptions: number;
  unloggedMealsDetected: Array<{
    userId: string;
    missingMealTypes: Array<"breakfast" | "lunch" | "dinner">;
  }>;
}

/**
 * Mengevaluasi seluruh pengguna yang mengaktifkan pengingat makan
 * dan mendeteksi sesi makan harian yang belum di-log.
 */
export async function evaluateAndSendUnloggedMealReminders(
  currentDateOverride?: string
): Promise<UnloggedMealReminderResult> {
  const todayStr =
    currentDateOverride ?? new Date().toISOString().slice(0, 10);
  const subscriptions = await repository.getAllActivePushSubscriptions();
  const canSendPush = ensureVapidConfigured() && env.NODE_ENV !== "test";

  const unloggedMealsDetected: UnloggedMealReminderResult["unloggedMealsDetected"] =
    [];

  for (const sub of subscriptions) {
    const dailyMeals = await repository.getDailyMealLogs(sub.userId, todayStr);
    const loggedTypes = new Set(dailyMeals.map((m) => m.mealType));

    const missing: Array<"breakfast" | "lunch" | "dinner"> = [];
    if (!loggedTypes.has("breakfast")) missing.push("breakfast");
    if (!loggedTypes.has("lunch")) missing.push("lunch");
    if (!loggedTypes.has("dinner")) missing.push("dinner");

    if (missing.length > 0) {
      unloggedMealsDetected.push({
        userId: sub.userId,
        missingMealTypes: missing,
      });

      if (canSendPush && sub.endpoint.startsWith("https://")) {
        const mealNames = missing
          .map((t) =>
            t === "breakfast"
              ? "Sarapan"
              : t === "lunch"
              ? "Makan Siang"
              : "Makan Malam"
          )
          .join(", ");

        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            JSON.stringify({
              title: "Pengingat Nutrisi NutriSnap 🥗",
              body: `Kamu belum mencatat ${mealNames} hari ini. Yuk foto piringmu atau catat manual agar target kalori/protein tercapai!`,
              url: "/log",
            })
          );
        } catch {
          // Abaikan jika endpoint sudah kadaluarsa
        }
      }
    }
  }

  return {
    checkedSubscriptions: subscriptions.length,
    unloggedMealsDetected,
  };
}

/**
 * Menjalankan background scheduler setiap 15 menit di server Coolify.
 */
export function startMealReminderCronJob(): void {
  cron.schedule("*/15 * * * *", () => {
    void evaluateAndSendUnloggedMealReminders();
  });
}

