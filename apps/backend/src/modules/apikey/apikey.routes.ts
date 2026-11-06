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

  // Model gemini-2.5-flash dinonaktifkan Google untuk pengguna baru, arahkan ke gemini-3.8-flash
  const targetModel =
    modelName === "gemini-2.5-flash" || !modelName
      ? "gemini-3.8-flash"
      : modelName === "gemini-2.5-pro"
      ? "gemini-3.8-pro"
      : modelName;

  try {
    const ai = new GoogleGenAI({ apiKey });
    await ai.models.get({ model: targetModel });
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

  // Migrasi otomatis: Google telah membatasi gemini-2.5-flash untuk pengguna baru
  let model = keyRecord.preferredModel || "gemini-3.8-flash";
  let needsDbUpdate = false;
  if (model === "gemini-2.5-flash") {
    model = "gemini-3.8-flash";
    needsDbUpdate = true;
  } else if (model === "gemini-2.5-pro") {
    model = "gemini-3.8-pro";
    needsDbUpdate = true;
  }

  if (needsDbUpdate) {
    void repository
      .upsertUserApiKey(userId, {
        encryptedKey: keyRecord.encryptedKey,
        keyHint: keyRecord.keyHint,
        preferredModel: model,
        isValid: keyRecord.isValid,
      })
      .catch(() => {});
  }

  return {
    ai,
    model,
  };
}

export async function registerApiKeyRoutes(app: FastifyInstance): Promise<void> {
  // 1. GET /api/v1/apikey/status
  app.get("/api/v1/apikey/status", async (request, reply) => {
    const user = await requireAuthenticatedUser(request, reply);
    if (!user) return;

    const record = await repository.getUserApiKey(user.id);
    let preferredModel = record?.preferredModel ?? "gemini-3.8-flash";
    if (preferredModel === "gemini-2.5-flash") {
      preferredModel = "gemini-3.8-flash";
    } else if (preferredModel === "gemini-2.5-pro") {
      preferredModel = "gemini-3.8-pro";
    }

    return {
      success: true,
      data: {
        hasKey: Boolean(record),
        isValid: Boolean(record?.isValid),
        keyHint: record?.keyHint ?? null,
        preferredModel,
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
        preferredModel: "gemini-3.8-flash",
        lastVerifiedAt: null,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  });
}

