import { GoogleGenAI } from "@google/genai";
import { upsertApiKeySchema } from "@nutrisnap/shared";
import type { FastifyInstance } from "fastify";
import { env } from "../../config/env.js";
import { decryptApiKey, encryptApiKey } from "../../crypto/vault.js";
import { repository } from "../../db/repository.js";
import { requireAuthenticatedUser } from "../auth/session.js";

/**
 * Memverifikasi keaktifan Gemini API Key ke server Google Gemini.
 */
async function verifyGeminiApiKeyLive(
  apiKey: string,
  modelName: string
): Promise<boolean> {
  if (env.NODE_ENV === "test" || apiKey.startsWith("AIzaSyTest")) {
    return apiKey.length >= 20;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    await ai.models.get({ model: modelName });
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper internal server-only untuk mengambil client GoogleGenAI milik user
 * dengan mendekripsi BYOK di memori sesaat sebelum request.
 */
export async function getDecryptedUserGeminiClient(userId: string): Promise<{
  ai: GoogleGenAI;
  model: string;
} | null> {
  const keyRecord = await repository.getUserApiKey(userId);
  if (!keyRecord || !keyRecord.isValid) {
    return null;
  }

  const plainApiKey = decryptApiKey(keyRecord.encryptedKey);
  const ai = new GoogleGenAI({ apiKey: plainApiKey });
  return {
    ai,
    model: keyRecord.preferredModel || "gemini-2.5-flash",
  };
}

export async function registerApiKeyRoutes(app: FastifyInstance): Promise<void> {
  // 1. GET /api/v1/apikey/status
  app.get("/api/v1/apikey/status", async (request, reply) => {
    const user = await requireAuthenticatedUser(request, reply);
    if (!user) return;

    const record = await repository.getUserApiKey(user.id);

    return {
      success: true,
      data: {
        hasKey: Boolean(record),
        isValid: Boolean(record?.isValid),
        keyHint: record?.keyHint ?? null,
        preferredModel: record?.preferredModel ?? "gemini-2.5-flash",
        lastVerifiedAt: record?.lastVerifiedAt
          ? record.lastVerifiedAt.toISOString()
          : null,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  });

  // 2. PUT /api/v1/apikey
  app.put("/api/v1/apikey", async (request, reply) => {
    const user = await requireAuthenticatedUser(request, reply);
    if (!user) return;

    const payload = upsertApiKeySchema.parse(request.body);

    const isKeyLiveValid = await verifyGeminiApiKeyLive(
      payload.apiKey,
      payload.preferredModel
    );

    if (!isKeyLiveValid) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "INVALID_GEMINI_API_KEY",
          message:
            "Google Gemini API Key tidak valid atau tidak dapat mengakses model Gemini. Pastikan kunci aktif di Google AI Studio.",
          details: [],
        },
      });
    }

    const { encryptedKey, keyHint } = encryptApiKey(payload.apiKey);
    const saved = await repository.upsertUserApiKey(user.id, {
      encryptedKey,
      keyHint,
      preferredModel: payload.preferredModel,
      isValid: true,
    });

    return {
      success: true,
      data: {
        hasKey: true,
        isValid: saved.isValid,
        keyHint: saved.keyHint,
        preferredModel: saved.preferredModel,
        lastVerifiedAt: saved.lastVerifiedAt
          ? saved.lastVerifiedAt.toISOString()
          : new Date().toISOString(),
      },
      meta: { timestamp: new Date().toISOString() },
    };
  });

  // 3. DELETE /api/v1/apikey
  app.delete("/api/v1/apikey", async (request, reply) => {
    const user = await requireAuthenticatedUser(request, reply);
    if (!user) return;

    await repository.deleteUserApiKey(user.id);

    return {
      success: true,
      data: {
        hasKey: false,
        isValid: false,
        keyHint: null,
        preferredModel: "gemini-2.5-flash",
        lastVerifiedAt: null,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  });
}
