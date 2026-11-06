import { sendChatMessageSchema } from "@nutrisnap/shared";
import type { FastifyInstance } from "fastify";
import { env } from "../../config/env.js";
import { repository } from "../../db/repository.js";
import { getDecryptedUserGeminiClient } from "../apikey/apikey.routes.js";
import { requireAuthenticatedUser } from "../auth/session.js";

function buildContextualFallbackReply(params: {
  userName: string;
  goalType: string;
  remainingCalories: number;
  remainingProteinG: number;
  userQuestion: string;
  hasKey: boolean;
}): string {
  const {
    userName,
    goalType,
    remainingCalories,
    remainingProteinG,
    hasKey,
  } = params;

  const modeLabel =
    goalType === "bulking"
      ? "Bulking (Surplus Kalori)"
      : goalType === "cutting"
      ? "Cutting (Defisit Kalori)"
      : "Maintenance";

  const proteinTips =
    remainingProteinG > 25
      ? `Untuk menutup sisa **${remainingProteinG}g protein** dan **${Math.max(
          0,
          remainingCalories
        )} kcal** hari ini, berikut opsi menu praktis:\n- **150g Dada Ayam Bakar + 150g Nasi Putih** (~445 kcal, 49g protein)\n- **3 Putih Telur + 1 Telur Utuh + 100g Tempe Panggang** (~380 kcal, 35g protein)\n- **1 Scoop Whey Protein + 1 Pisang Ambon + 20g Selai Kacang** (~340 kcal, 30g protein)`
      : `Target protein harian Anda hampir terpenuhi (sisa **${remainingProteinG}g protein**). Anda cukup memilih porsi seimbang seperti tahu/tempe kukus atau telur rebus.`;

  const keyNotice = !hasKey
    ? "\n\n*(Catatan: Anda saat ini menggunakan Smart Nutrition Engine bawaan. Tambahkan Google Gemini API Key pribadi Anda di menu Pengaturan untuk mengaktifkan diskusi AI Gemini 3.8 Flash tanpa batas!)*"
    : "";

  return `Halo **${userName}**! Berdasarkan profil **${modeLabel}** Anda hari ini:\n\n${proteinTips}${keyNotice}`;
}

export async function registerChatRoutes(app: FastifyInstance): Promise<void> {
  // 1. GET /api/v1/chat/history
  app.get("/api/v1/chat/history", async (request, reply) => {
    const user = await requireAuthenticatedUser(request, reply);
    if (!user) return;

    const messages = await repository.getChatHistory(user.id);
    const profile = await repository.getUserProfile(user.id);
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayMeals = await repository.getDailyMealLogs(user.id, todayStr);
    const apiKeyRecord = await repository.getUserApiKey(user.id);

    const consumedCalories = todayMeals.reduce(
      (acc, m) => acc + m.totalCalories,
      0
    );
    const consumedProteinG = Number(
      todayMeals.reduce((acc, m) => acc + m.totalProteinG, 0).toFixed(1)
    );

    const targetCalories = profile?.targetDailyCalories ?? 2750;
    const targetProteinG = profile?.targetDailyProteinG ?? 120;

    return {
      success: true,
      data: {
        messages,
        context: {
          goalType: profile?.goalType ?? "bulking",
          targetCalories,
          consumedCalories,
          remainingCalories: targetCalories - consumedCalories,
          targetProteinG,
          consumedProteinG,
          remainingProteinG: Math.max(
            0,
            Number((targetProteinG - consumedProteinG).toFixed(1))
          ),
          hasApiKey: Boolean(apiKeyRecord?.isValid),
        },
      },
      meta: { timestamp: new Date().toISOString() },
    };
  });

  // 2. POST /api/v1/chat/message
  app.post("/api/v1/chat/message", async (request, reply) => {
    const user = await requireAuthenticatedUser(request, reply);
    if (!user) return;

    const payload = sendChatMessageSchema.parse(request.body);
    const profile = await repository.getUserProfile(user.id);
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayMeals = await repository.getDailyMealLogs(user.id, todayStr);

    const consumedCalories = todayMeals.reduce(
      (acc, m) => acc + m.totalCalories,
      0
    );
    const consumedProteinG = Number(
      todayMeals.reduce((acc, m) => acc + m.totalProteinG, 0).toFixed(1)
    );

    const targetCalories = profile?.targetDailyCalories ?? 2750;
    const targetProteinG = profile?.targetDailyProteinG ?? 120;
    const remainingCalories = targetCalories - consumedCalories;
    const remainingProteinG = Math.max(
      0,
      Number((targetProteinG - consumedProteinG).toFixed(1))
    );
    const goalType = profile?.goalType ?? "bulking";

    const clientBundle = await getDecryptedUserGeminiClient(user.id);
    let assistantReply = "";

    if (clientBundle && env.NODE_ENV !== "test") {
      try {
        const systemInstruction = [
          `Anda adalah NutriSnap AI Coach, ahli gizi olahraga dan konsultan bulking/cutting profesional berbahasa Indonesia.`,
          `Profil Pengguna: Nama=${user.name}, Program=${goalType.toUpperCase()}, Berat=${
            profile?.currentWeightKg ?? 60
          }kg -> Target=${profile?.targetWeightKg ?? 65}kg.`,
          `Target Harian: ${targetCalories} kcal & ${targetProteinG}g protein.`,
          `Asupan Hari Ini: ${consumedCalories} kcal & ${consumedProteinG}g protein (Sisa: ${remainingCalories} kcal & ${remainingProteinG}g protein).`,
          `Instruksi: Jawab pertanyaan pengguna secara cerdas, ramah, dan spesifik sesuai pesan mereka (termasuk jika mereka menyebut suplemen seperti Evomass, kreatin, susu gainer, atau makanan khas lokal). Berikan estimasi kalori dan gram protein bila relevan.`,
        ].join(" ");

        // Sertakan riwayat obrolan terakhir agar AI memahami konteks multi-turn
        const chatHistory = await repository.getChatHistory(user.id);
        const contents = [
          ...chatHistory.slice(-6).map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
          {
            role: "user",
            parts: [{ text: payload.message }],
          },
        ];

        try {
          const response = await clientBundle.ai.models.generateContent({
            model: clientBundle.model,
            contents,
            config: {
              systemInstruction,
              temperature: 0.4,
            },
          });
          assistantReply = response.text || "";
        } catch (initialErr) {
          const errStr = String(initialErr);
          // Fallback otomatis ke gemini-3.8-flash jika model sebelumnya tidak tersedia
          if (
            clientBundle.model !== "gemini-3.8-flash" ||
            errStr.includes("404") ||
            errStr.includes("no longer available")
          ) {
            const retryRes = await clientBundle.ai.models.generateContent({
              model: "gemini-3.8-flash",
              contents,
              config: {
                systemInstruction,
                temperature: 0.4,
              },
            });
            assistantReply = retryRes.text || "";
          } else {
            throw initialErr;
          }
        }
      } catch (err) {
        const errStr = String(err);
        if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("quota")) {
          assistantReply =
            "⚠️ Kuota gratis Google Gemini API kamu sedang mencapai batas sementara. Mohon tunggu 1-2 menit sebelum mengirim pesan berikutnya.";
        } else if (
          errStr.includes("API_KEY_INVALID") ||
          errStr.includes("API key not valid")
        ) {
          assistantReply =
            "⚠️ Kunci Google Gemini API kamu tidak valid atau tidak memiliki akses. Silakan periksa atau perbarui kunci API di menu Pengaturan.";
        } else {
          assistantReply = `⚠️ Terjadi kendala saat memproses jawaban dengan Gemini AI: ${
            err instanceof Error ? err.message : String(err)
          }. Silakan periksa kunci API di Pengaturan.`;
        }
      }
    } else if (env.NODE_ENV === "test") {
      assistantReply = buildContextualFallbackReply({
        userName: user.name,
        goalType,
        remainingCalories,
        remainingProteinG,
        userQuestion: payload.message,
        hasKey: true,
      });
    } else {
      assistantReply = `Halo **${user.name}**! Kunci Google Gemini API belum ditambahkan di menu **Pengaturan**. Silakan masukkan kunci API Gemini gratis kamu terlebih dahulu agar saya dapat menganalisis dan menjawab pertanyaan konsultasi nutrisi kamu secara langsung!`;
    }

    const updatedMessages = await repository.appendChatMessages(
      user.id,
      payload.message,
      assistantReply
    );

    return {
      success: true,
      data: {
        reply: assistantReply,
        messages: updatedMessages,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  });

  // 3. DELETE /api/v1/chat/history
  app.delete("/api/v1/chat/history", async (request, reply) => {
    const user = await requireAuthenticatedUser(request, reply);
    if (!user) return;

    await repository.clearChatHistory(user.id);
    return {
      success: true,
      data: { cleared: true },
      meta: { timestamp: new Date().toISOString() },
    };
  });
}

