import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { env } from "../../config/env.js";
import { repository } from "../../db/repository.js";
import {
  clearSessionCookie,
  requireAuthenticatedUser,
  setSessionCookie,
  signSessionToken,
} from "./session.js";

const googleTokenSignInSchema = z.object({
  googleId: z.string().min(3),
  email: z.string().email(),
  name: z.string().min(1),
  avatarUrl: z.string().url().optional().nullable(),
});

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  // 1. Initiate Google OAuth 2.0 Redirect
  app.get("/api/v1/auth/google", async (_request, reply) => {
    const isPlaceholderClient =
      !env.GOOGLE_CLIENT_ID ||
      env.GOOGLE_CLIENT_ID.includes("placeholder") ||
      env.GOOGLE_CLIENT_ID.includes("dummy");

    if (isPlaceholderClient) {
      // Fallback mulus jika Google OAuth belum dikonfigurasi di local dev
      const demoUser = await repository.upsertGoogleUser({
        googleId: "google-demo-raka-001",
        email: "raka@nutrisnap.app",
        name: "Raka Pratama",
        avatarUrl: null,
      });
      const token = signSessionToken({
        userId: demoUser.id,
        email: demoUser.email,
      });
      setSessionCookie(reply, token);
      const profile = await repository.getUserProfile(demoUser.id);
      const targetPath = profile?.onboardingCompleted ? "/dashboard" : "/onboarding";
      return reply.redirect(`${env.FRONTEND_URL}${targetPath}?token=${encodeURIComponent(token)}`);
    }

    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account",
    });

    return reply.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    );
  });

  // 2. Google OAuth 2.0 Callback
  app.get("/api/v1/auth/google/callback", async (request, reply) => {
    const query = request.query as { code?: string; error?: string };
    if (query.error || !query.code) {
      return reply.redirect(
        `${env.FRONTEND_URL}/login?error=${encodeURIComponent(
          query.error ?? "oauth_cancelled"
        )}`
      );
    }

    try {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: query.code,
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          redirect_uri: env.GOOGLE_CALLBACK_URL,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenRes.ok) {
        return reply.redirect(`${env.FRONTEND_URL}/login?error=token_exchange_failed`);
      }

      const tokenData = (await tokenRes.json()) as { access_token?: string };
      if (!tokenData.access_token) {
        return reply.redirect(`${env.FRONTEND_URL}/login?error=no_access_token`);
      }

      const userInfoRes = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        }
      );

      if (!userInfoRes.ok) {
        return reply.redirect(`${env.FRONTEND_URL}/login?error=userinfo_failed`);
      }

      const googleProfile = (await userInfoRes.json()) as {
        sub: string;
        email: string;
        name?: string;
        picture?: string;
      };

      const user = await repository.upsertGoogleUser({
        googleId: googleProfile.sub,
        email: googleProfile.email,
        name: googleProfile.name ?? googleProfile.email.split("@")[0] ?? "NutriSnap User",
        avatarUrl: googleProfile.picture ?? null,
      });

      const sessionToken = signSessionToken({
        userId: user.id,
        email: user.email,
      });
      setSessionCookie(reply, sessionToken);

      const profile = await repository.getUserProfile(user.id);
      const redirectPath = profile?.onboardingCompleted
        ? "/dashboard"
        : "/onboarding";

      return reply.redirect(
        `${env.FRONTEND_URL}${redirectPath}?token=${encodeURIComponent(sessionToken)}`
      );
    } catch {
      return reply.redirect(`${env.FRONTEND_URL}/login?error=oauth_internal_error`);
    }
  });

  // 3. Direct Google Payload / Demo Login Endpoint
  app.post("/api/v1/auth/google/token", async (request, reply) => {
    if (env.NODE_ENV === "production" && process.env.ENABLE_DEMO_LOGIN !== "true") {
      return reply.status(403).send({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Login token langsung dinonaktifkan di lingkungan produksi.",
        },
      });
    }

    const payload = googleTokenSignInSchema.parse(request.body);
    const user = await repository.upsertGoogleUser({
      googleId: payload.googleId,
      email: payload.email,
      name: payload.name,
      avatarUrl: payload.avatarUrl ?? null,
    });

    const token = signSessionToken({ userId: user.id, email: user.email });
    setSessionCookie(reply, token);

    const profile = await repository.getUserProfile(user.id);
    const apiKey = await repository.getUserApiKey(user.id);

    return {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
        onboardingCompleted: Boolean(profile?.onboardingCompleted),
        hasApiKey: Boolean(apiKey?.isValid),
      },
      meta: { timestamp: new Date().toISOString() },
    };
  });

  // 4. Current Authenticated User (/api/v1/auth/me)
  app.get("/api/v1/auth/me", async (request, reply) => {
    const user = await requireAuthenticatedUser(request, reply);
    if (!user) return;

    const profile = await repository.getUserProfile(user.id);
    const apiKey = await repository.getUserApiKey(user.id);

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
        onboardingCompleted: Boolean(profile?.onboardingCompleted),
        hasApiKey: Boolean(apiKey?.isValid),
        keyHint: apiKey?.keyHint ?? null,
        profile,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  });

  // 5. Logout (/api/v1/auth/logout)
  app.post("/api/v1/auth/logout", async (_request, reply) => {
    clearSessionCookie(reply);
    return {
      success: true,
      data: { loggedOut: true },
      meta: { timestamp: new Date().toISOString() },
    };
  });
}

