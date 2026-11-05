import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "../config/env.js";

const ALGORITHM = "aes-256-gcm";
const IV_BYTE_LENGTH = 12; // 96-bit IV standar NIST untuk AES-GCM
const AUTH_TAG_BYTE_LENGTH = 16; // 128-bit Authentication Tag

function resolveMasterKeyBuffer(customHexKey?: string): Buffer {
  const hexKey = customHexKey ?? env.ENCRYPTION_MASTER_KEY;
  if (!hexKey || hexKey.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(hexKey)) {
    throw new Error(
      "ENCRYPTION_MASTER_KEY harus berupa 64 karakter hexadecimal (32 bytes)."
    );
  }
  return Buffer.from(hexKey, "hex");
}

export interface EncryptedKeyResult {
  encryptedKey: string;
  keyHint: string;
}

/**
 * Mengenkripsi BYOK Gemini API Key menggunakan AES-256-GCM.
 * Format output: `iv_base64:authTag_base64:ciphertext_base64`
 * Sesuai dengan AGENTS.md Section 3.1.
 */
export function encryptApiKey(
  plainApiKey: string,
  customMasterKeyHex?: string
): EncryptedKeyResult {
  const trimmedKey = plainApiKey.trim();
  if (!trimmedKey || trimmedKey.length < 12) {
    throw new Error("API Key tidak valid atau terlalu pendek untuk dienkripsi.");
  }

  const masterKey = resolveMasterKeyBuffer(customMasterKeyHex);
  const iv = randomBytes(IV_BYTE_LENGTH);
  const cipher = createCipheriv(ALGORITHM, masterKey, iv, {
    authTagLength: AUTH_TAG_BYTE_LENGTH,
  });

  const encryptedBuffer = Buffer.concat([
    cipher.update(trimmedKey, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  const encryptedKey = [
    iv.toString("base64"),
    authTag.toString("base64"),
    encryptedBuffer.toString("base64"),
  ].join(":");

  const keyHint =
    trimmedKey.length > 8
      ? `${trimmedKey.slice(0, 4)}...${trimmedKey.slice(-4)}`
      : "****";

  return { encryptedKey, keyHint };
}

/**
 * Mendekripsi BYOK Gemini API Key di memori server.
 * Dilarang keras mencatat output fungsi ini ke log atau mengirimnya ke client.
 */
export function decryptApiKey(
  encryptedPayload: string,
  customMasterKeyHex?: string
): string {
  const parts = encryptedPayload.split(":");
  if (parts.length !== 3) {
    throw new Error(
      "Format payload enkripsi tidak valid. Harus iv:authTag:ciphertext."
    );
  }

  const [ivB64, authTagB64, cipherB64] = parts;
  if (!ivB64 || !authTagB64 || !cipherB64) {
    throw new Error("Komponen payload enkripsi tidak lengkap.");
  }

  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const ciphertext = Buffer.from(cipherB64, "base64");

  if (iv.length !== IV_BYTE_LENGTH || authTag.length !== AUTH_TAG_BYTE_LENGTH) {
    throw new Error("Panjang IV atau Authentication Tag tidak valid.");
  }

  const masterKey = resolveMasterKeyBuffer(customMasterKeyHex);
  const decipher = createDecipheriv(ALGORITHM, masterKey, iv, {
    authTagLength: AUTH_TAG_BYTE_LENGTH,
  });
  decipher.setAuthTag(authTag);

  const decryptedBuffer = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decryptedBuffer.toString("utf8");
}
