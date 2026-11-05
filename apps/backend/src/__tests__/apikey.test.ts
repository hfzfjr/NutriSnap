import { describe, expect, it } from "vitest";
import { buildApp } from "../app.js";

describe("@nutrisnap/backend — BYOK Gemini API Key Management [NS-103]", () => {
  it("encrypts, stores, returns masked keyHint only, and deletes user Gemini API key", async () => {
    const app = await buildApp();

    const loginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/google/token",
      payload: {
        googleId: "google-byok-user-01",
        email: "byok@nutrisnap.app",
        name: "Sinta Tracker",
      },
    });
    const token = loginRes.json().data.token as string;
    const rawKey = "AIzaSyTest-PersonalGeminiKey-99887766xQp";

    const putRes = await app.inject({
      method: "PUT",
      url: "/api/v1/apikey",
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        apiKey: rawKey,
        preferredModel: "gemini-2.5-flash",
      },
    });

    expect(putRes.statusCode).toBe(200);
    const putBody = putRes.json();
    expect(putBody.success).toBe(true);
    expect(putBody.data.hasKey).toBe(true);
    expect(putBody.data.keyHint).toBe("AIza...6xQp");
    expect(JSON.stringify(putBody)).not.toContain(rawKey);

    const statusRes = await app.inject({
      method: "GET",
      url: "/api/v1/apikey/status",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(statusRes.statusCode).toBe(200);
    expect(statusRes.json().data.keyHint).toBe("AIza...6xQp");

    const delRes = await app.inject({
      method: "DELETE",
      url: "/api/v1/apikey",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(delRes.statusCode).toBe(200);
    expect(delRes.json().data.hasKey).toBe(false);

    await app.close();
  });
});
