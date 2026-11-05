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
import { registerMealRoutes } from "./modules/meals/meals.routes.js";
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

    return reply.status(statusCode).send({
      success: false,
      error: {
        code: errObj?.code ?? "INTERNAL_SERVER_ERROR",
        message: errObj?.message || "Terjadi kesalahan pada server.",
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

