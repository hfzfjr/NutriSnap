import { describe, expect, it } from "vitest";
import { buildApp } from "../app.js";

describe("@nutrisnap/backend — Google OAuth & Session Auth [NS-102]", () => {
  it("authenticates user via Google OAuth token endpoint and verifies /api/v1/auth/me", async () => {
    const app = await buildApp();

    const loginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/google/token",
      payload: {
        googleId: "google-test-12345",
        email: "raka.test@nutrisnap.app",
        name: "Raka Pratama",
      },
    });

    expect(loginRes.statusCode).toBe(200);
    const loginBody = loginRes.json();
    expect(loginBody.success).toBe(true);
    expect(loginBody.data.token).toBeTruthy();
    expect(loginBody.data.user.email).toBe("raka.test@nutrisnap.app");

    const meRes = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: {
        Authorization: `Bearer ${loginBody.data.token}`,
      },
    });

    expect(meRes.statusCode).toBe(200);
    const meBody = meRes.json();
    expect(meBody.success).toBe(true);
    expect(meBody.data.user.name).toBe("Raka Pratama");
    expect(meBody.data.onboardingCompleted).toBe(false);

    await app.close();
  });

  it("rejects unauthorized requests to /api/v1/auth/me with 401", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });
});

