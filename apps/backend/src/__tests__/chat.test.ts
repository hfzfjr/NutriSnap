import { describe, expect, it } from "vitest";
import { buildApp } from "../app.js";

describe("@nutrisnap/backend — Contextual AI Bulking & Diet Assistant Chatbot [NS-401, NS-403]", () => {
  it("provides contextual nutrition advice and persists chat history", async () => {
    const app = await buildApp();

    const loginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/google/token",
      payload: {
        googleId: "google-chat-user-01",
        email: "coach@nutrisnap.app",
        name: "Raka Bulker",
      },
    });
    const token = loginRes.json().data.token as string;

    const msgRes = await app.inject({
      method: "POST",
      url: "/api/v1/chat/message",
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        message: "Malam ini saya masih kurang protein untuk bulking, sebaiknya makan apa?",
      },
    });

    expect(msgRes.statusCode).toBe(200);
    const body = msgRes.json();
    expect(body.success).toBe(true);
    expect(body.data.reply).toContain("Raka Bulker");
    expect(body.data.messages).toHaveLength(2);

    const historyRes = await app.inject({
      method: "GET",
      url: "/api/v1/chat/history",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(historyRes.statusCode).toBe(200);
    expect(historyRes.json().data.messages).toHaveLength(2);

    const clearRes = await app.inject({
      method: "DELETE",
      url: "/api/v1/chat/history",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(clearRes.statusCode).toBe(200);

    await app.close();
  });
});
