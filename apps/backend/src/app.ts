import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import { estimateManualFoodRequestSchema } from "@nutrisnap/shared";
import Fastify, { type FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { env } from "./config/env.js";
import {
  INDONESIAN_FITNESS_FOODS,
  estimateMacrosFromLocalCatalog,
} from "./db/seed-foods.js";
import { registerApiKeyRoutes } from "./modules/apikey/apikey.routes.js";
import { registerAuthRoutes } from "./modules/auth/auth.routes.js";
import { registerChatRoutes } from "./modules/chat/chat.routes.js";
import { registerMealRoutes } from "./modules/meals/meals.routes.js";
import { registerNotificationRoutes } from "./modules/notifications/notifications.routes.js";
import { registerProfileRoutes } from "./modules/profile/profile.routes.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: env.NODE_ENV !== "test",
    bodyLimit: 10 * 1024 * 1024, // 10MB body limit untuk gambar terkompresi
  });

  await app.register(cors, {
    origin: [env.FRONTEND_URL, "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  await app.register(cookie, {
    secret: env.SESSION_SECRET,
    hook: "onRequest",
  });

  await registerAuthRoutes(app);
  await registerApiKeyRoutes(app);
  await registerProfileRoutes(app);
  await registerMealRoutes(app);
  await registerChatRoutes(app);
  await registerNotificationRoutes(app);

  // Global Error Handler sesuai standar amplop respons di docs/API_CONTRACT.md
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(422).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Input data tidak valid.",
          details: error.errors,
        },
      });
    }

    const errObj = error as { statusCode?: number; code?: string; message?: string };
    const statusCode =
      typeof errObj?.statusCode === "number" ? errObj.statusCode : 500;

    let message = errObj?.message || "Terjadi kesalahan pada server.";
    // Bersihkan jika pesan error berupa JSON string mentah dari Google API / upstream
    if (message.startsWith("{") || message.includes('"error":')) {
      try {
        const jsonStart = message.indexOf("{");
        const jsonEnd = message.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          const parsed = JSON.parse(message.substring(jsonStart, jsonEnd + 1)) as {
            error?: { message?: string; status?: string; code?: number };
            message?: string;
          };
          const innerMsg = parsed?.error?.message || parsed?.message;
          if (innerMsg) {
            if (innerMsg.includes("no longer available") || innerMsg.includes("404")) {
              message =
                "Model Gemini AI telah dialihkan ke gemini-3.8-flash oleh Google. Sistem telah memperbarui konfigurasi, silakan coba kembali.";
            } else if (
              innerMsg.includes("API key not valid") ||
              innerMsg.includes("API_KEY_INVALID")
            ) {
              message =
                "Kunci Google Gemini API tidak valid. Periksa kunci kamu di menu Pengaturan.";
            } else if (
              innerMsg.includes("quota") ||
              innerMsg.includes("RESOURCE_EXHAUSTED")
            ) {
              message =
                "Batas kuota gratis Google Gemini API kamu telah tercapai sementara. Coba beberapa saat lagi.";
            } else if (
              innerMsg.includes("high demand") ||
              innerMsg.includes("503") ||
              innerMsg.includes("UNAVAILABLE")
            ) {
              message =
                "Server Google Gemini AI sedang mengalami lonjakan trafik (503 Service Unavailable). Silakan coba lagi dalam beberapa detik.";
            } else {
              message = `Layanan AI: ${innerMsg}`;
            }
          }
        }
      } catch {
        // Biarkan pesan fallback
      }
    }

    return reply.status(statusCode).send({
      success: false,
      error: {
        code: errObj?.code ?? "INTERNAL_SERVER_ERROR",
        message,
        details: [],
      },
    });
  });

  // Healthcheck Endpoint (/api/v1/health)
  app.get("/api/v1/health", async () => {
    return {
      success: true,
      data: {
        service: "@nutrisnap/backend",
        status: "healthy",
        environment: env.NODE_ENV,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  });

  // Katalog Referensi Makanan Lokal (/api/v1/foods/reference)
  app.get("/api/v1/foods/reference", async () => {
    return {
      success: true,
      data: {
        foods: INDONESIAN_FITNESS_FOODS,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  });

  // Estimasi cepat dari katalog lokal untuk Manual Input Form
  app.post("/api/v1/meals/estimate-local", async (request, reply) => {
    const payload = estimateManualFoodRequestSchema.parse(request.body);
    const result = estimateMacrosFromLocalCatalog(payload.foodName, payload.weightGrams);

    if (!result) {
      return reply.status(404).send({
        success: false,
        error: {
          code: "FOOD_NOT_FOUND_IN_LOCAL_CATALOG",
          message:
            "Makanan belum ditemukan di katalog lokal. Gunakan estimasi AI Gemini atau isi kalori manual.",
          details: [],
        },
      });
    }

    return {
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  });

  return app;
}

