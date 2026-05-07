// AES-256-GCM encryption with PBKDF2 key derivation. Runs in browser.
const enc = new TextEncoder();

function bufToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function b64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 200_000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptBlob(
  data: ArrayBuffer,
  passphrase: string,
): Promise<{ ciphertext: Blob; ivB64: string; saltB64: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, data);
  return {
    ciphertext: new Blob([ct]),
    ivB64: bufToB64(iv.buffer),
    saltB64: bufToB64(salt.buffer),
  };
}

export async function decryptBlob(
  ciphertext: ArrayBuffer,
  passphrase: string,
  ivB64: string,
  saltB64: string,
): Promise<ArrayBuffer> {
  const iv = new Uint8Array(b64ToBuf(ivB64));
  const salt = new Uint8Array(b64ToBuf(saltB64));
  const key = await deriveKey(passphrase, salt);
  return crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, ciphertext);
}

export function randomFileName(): string {
  const arr = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}
