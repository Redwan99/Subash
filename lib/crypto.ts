import "server-only";
// lib/crypto.ts
// AES-256-GCM encryption for environment variable storage.
// Uses ENV_ENCRYPTION_KEY (32 hex bytes = 64 chars) from process.env.

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const raw = process.env.ENV_ENCRYPTION_KEY;
  if (!raw || raw.length < 32) {
    // Fallback: derive a key from a seed (not ideal for production)
    const seed = raw || "subash-default-encryption-key-seed-2024";
    return crypto.createHash("sha256").update(seed).digest();
  }
  // If it's hex-encoded (64 chars), decode it
  if (raw.length === 64 && /^[0-9a-fA-F]+$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }
  // Otherwise, hash it to get exactly 32 bytes
  return crypto.createHash("sha256").update(raw).digest();
}

export function encrypt(plaintext: string): { encrypted: string; iv: string; tag: string } {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag().toString("hex");

  return {
    encrypted,
    iv: iv.toString("hex"),
    tag,
  };
}

export function decrypt(encrypted: string, iv: string, tag: string): string {
  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(tag, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
