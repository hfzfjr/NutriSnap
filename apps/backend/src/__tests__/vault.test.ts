import { describe, expect, it } from "vitest";
import { decryptApiKey, encryptApiKey } from "../crypto/vault.js";

describe("@nutrisnap/backend — AES-256-GCM BYOK Encryption Vault [NS-101]", () => {
  const sampleGeminiKey = "AIzaSyD-9x82kLp01MnBvCxZaQwErTyUiOp789xQp";

  it("encrypts and decrypts API key accurately with iv:authTag:ciphertext format", () => {
    const { encryptedKey, keyHint } = encryptApiKey(sampleGeminiKey);

    expect(keyHint).toBe("AIza...9xQp");
    expect(encryptedKey).not.toContain(sampleGeminiKey);
    expect(encryptedKey.split(":")).toHaveLength(3);

    const decrypted = decryptApiKey(encryptedKey);
    expect(decrypted).toBe(sampleGeminiKey);
  });

  it("generates a unique random 96-bit IV for every encryption call", () => {
    const first = encryptApiKey(sampleGeminiKey);
    const second = encryptApiKey(sampleGeminiKey);

    expect(first.encryptedKey).not.toBe(second.encryptedKey);
    expect(decryptApiKey(first.encryptedKey)).toBe(sampleGeminiKey);
    expect(decryptApiKey(second.encryptedKey)).toBe(sampleGeminiKey);
  });

  it("throws security error when ciphertext or authTag is tampered", () => {
    const { encryptedKey } = encryptApiKey(sampleGeminiKey);
    const [iv, authTag, cipher] = encryptedKey.split(":");

    // Tamper the authentication tag
    const tamperedTag = Buffer.from(authTag ?? "", "base64");
    if (tamperedTag[0] !== undefined) {
      tamperedTag[0] ^= 0xff;
    }
    const tamperedPayload = `${iv}:${tamperedTag.toString("base64")}:${cipher}`;

    expect(() => decryptApiKey(tamperedPayload)).toThrow();
  });

  it("rejects decryption with a different master key", () => {
    const keyA = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const keyB = "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210";

    const { encryptedKey } = encryptApiKey(sampleGeminiKey, keyA);
    expect(() => decryptApiKey(encryptedKey, keyB)).toThrow();
  });
});
