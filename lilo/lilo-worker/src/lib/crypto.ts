import * as jose from "jose";

/**
 * Generates an RSA key pair for signing and verifying.
 */
export function generateKeyPair() {
  return crypto.subtle.generateKey(
    {
      name: "RSA-PSS",
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  ) as Promise<CryptoKeyPair>;
}

/**
 * Imports a public or private key from a PEM-formatted string.
 */
export function importKey(
  keyType: "public" | "private",
  key: string,
): Promise<CryptoKey> {
  const format = keyType === "public" ? "spki" : "pkcs8";
  const keyUsage = keyType === "public" ? ["verify"] : ["sign"];

  const replace =
    /-----BEGIN (PUBLIC|PRIVATE) KEY-----|-----END (PUBLIC|PRIVATE) KEY-----|\n/g;

  const keyData = new Uint8Array(
    atob(key.replace(replace, ""))
      .split("")
      .map((c) => c.charCodeAt(0)),
  );

  return crypto.subtle.importKey(
    format,
    keyData,
    {
      name: "RSA-PSS",
      hash: "SHA-256",
    },
    keyType === "public",
    keyUsage,
  );
}

export async function exportKey(
  keyType: "public" | "private",
  key: CryptoKey,
): Promise<string> {
  if (keyType === "public") {
    return await jose.exportSPKI(key);
  }

  return await jose.exportPKCS8(key);
}
