import { createHmac, timingSafeEqual } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../../config/env.js";
import { repository, type UserRecord } from "../../db/repository.js";

export const SESSION_COOKIE_NAME = "nutrisnap_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export interface SessionPayload {
  userId: string;
  email: string;
  exp: number;
}

export function signSessionToken(payload: Omit<SessionPayload, "exp">): string {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const base64Data = Buffer.from(JSON.stringify(fullPayload), "utf8").toString(
    "base64url"
  );
  const signature = createHmac("sha256", env.SESSION_SECRET)
    .update(base64Data)
    .digest("base64url");

  return `${base64Data}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [base64Data, signature] = parts;
  if (!base64Data || !signature) return null;

  const expectedSig = createHmac("sha256", env.SESSION_SECRET)
    .update(base64Data)
    .digest("base64url");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(base64Data, "base64url").toString("utf8")
    ) as SessionPayload;
    if (!parsed.userId || typeof parsed.exp !== "number" || parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setSessionCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(SESSION_COOKIE_NAME, token, {
    path: "/",
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    domain: process.env.COOKIE_DOMAIN || undefined,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(SESSION_COOKIE_NAME, {
    path: "/",
    domain: process.env.COOKIE_DOMAIN || undefined,
  });
}

export async function resolveAuthenticatedUser(
  request: FastifyRequest
): Promise<UserRecord | null> {
  let token = request.cookies[SESSION_COOKIE_NAME];

  if (!token) {
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload) return null;

  return repository.getUserById(payload.userId);
}

export async function requireAuthenticatedUser(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<UserRecord | null> {
  const user = await resolveAuthenticatedUser(request);
  if (!user) {
    reply.status(401).send({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Sesi login tidak ditemukan atau telah berakhir. Silakan login kembali.",
        details: [],
      },
    });
    return null;
  }
  return user;
}

