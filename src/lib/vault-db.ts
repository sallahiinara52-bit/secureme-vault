// Local-only encrypted vault stored in IndexedDB.
// Nothing leaves the device. Files are AES-256-GCM encrypted at rest.
// Password verifier uses PBKDF2 + a random verifier value to ensure
// only the correct password unlocks the vault.

import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "securevault-pro";
const DB_VERSION = 1;

export type VaultMeta = {
  saltB64: string;       // PBKDF2 salt for the password
  verifierIv: string;    // IV for the verifier ciphertext
  verifierCt: string;    // Encrypted known plaintext ("svp-ok") used to verify password
  iterations: number;
  createdAt: number;
};

export type AlbumRow = {
  id: string;
  name: string;
  color: string;
  createdAt: number;
};

export type FileRow = {
  id: string;
  name: string;
  mime: string;
  size: number;
  iv: string;
  blob: Blob;        // encrypted ciphertext
  albumId: string | null;
  createdAt: number;
};

export type IntruderRow = {
  id: string;
  attemptedAt: number;
};

export type SettingsRow = {
  key: string;
  value: unknown;
};

let _db: IDBPDatabase | null = null;

export async function getDB(): Promise<IDBPDatabase> {
  if (_db) return _db;
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta");
      }
      if (!db.objectStoreNames.contains("albums")) {
        const s = db.createObjectStore("albums", { keyPath: "id" });
        s.createIndex("createdAt", "createdAt");
      }
      if (!db.objectStoreNames.contains("files")) {
        const s = db.createObjectStore("files", { keyPath: "id" });
        s.createIndex("albumId", "albumId");
        s.createIndex("createdAt", "createdAt");
      }
      if (!db.objectStoreNames.contains("intruders")) {
        db.createObjectStore("intruders", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
    },
  });
  return _db;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

function bufToB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
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

const VERIFIER_PLAINTEXT = "svp-ok-v1";
const ITERATIONS = 250_000;

export async function deriveKey(password: string, salt: Uint8Array, iterations = ITERATIONS): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function isInitialized(): Promise<boolean> {
  const db = await getDB();
  const meta = (await db.get("meta", "vault")) as VaultMeta | undefined;
  return !!meta;
}

export async function initializeVault(password: string): Promise<VaultMeta> {
  const db = await getDB();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    enc.encode(VERIFIER_PLAINTEXT),
  );
  const meta: VaultMeta = {
    saltB64: bufToB64(salt),
    verifierIv: bufToB64(iv),
    verifierCt: bufToB64(ct),
    iterations: ITERATIONS,
    createdAt: Date.now(),
  };
  await db.put("meta", meta, "vault");
  return meta;
}

/**
 * Verify a password by decrypting the verifier. Returns the derived CryptoKey
 * if successful, otherwise null. Only the correct password can decrypt this.
 */
export async function unlockVault(password: string): Promise<CryptoKey | null> {
  const db = await getDB();
  const meta = (await db.get("meta", "vault")) as VaultMeta | undefined;
  if (!meta) return null;
  try {
    const salt = new Uint8Array(b64ToBuf(meta.saltB64));
    const key = await deriveKey(password, salt, meta.iterations);
    const iv = new Uint8Array(b64ToBuf(meta.verifierIv));
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      b64ToBuf(meta.verifierCt),
    );
    if (dec.decode(pt) !== VERIFIER_PLAINTEXT) return null;
    return key;
  } catch {
    return null;
  }
}

export async function changePassword(oldPwd: string, newPwd: string): Promise<boolean> {
  const oldKey = await unlockVault(oldPwd);
  if (!oldKey) return false;
  const db = await getDB();

  // Re-encrypt every file with the new key
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const newKey = await deriveKey(newPwd, salt);

  const files = (await db.getAll("files")) as FileRow[];
  for (const f of files) {
    const oldIv = new Uint8Array(b64ToBuf(f.iv));
    const ctBuf = await f.blob.arrayBuffer();
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: oldIv as BufferSource }, oldKey, ctBuf);
    const newIv = crypto.getRandomValues(new Uint8Array(12));
    const newCt = await crypto.subtle.encrypt({ name: "AES-GCM", iv: newIv as BufferSource }, newKey, plain);
    f.iv = bufToB64(newIv);
    f.blob = new Blob([newCt]);
    await db.put("files", f);
  }

  // New verifier
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    newKey,
    enc.encode(VERIFIER_PLAINTEXT),
  );
  const meta: VaultMeta = {
    saltB64: bufToB64(salt),
    verifierIv: bufToB64(iv),
    verifierCt: bufToB64(ct),
    iterations: ITERATIONS,
    createdAt: Date.now(),
  };
  await db.put("meta", meta, "vault");
  return true;
}

export async function encryptFile(key: CryptoKey, file: File): Promise<FileRow> {
  const buf = await file.arrayBuffer();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, buf);
  return {
    id: crypto.randomUUID(),
    name: file.name,
    mime: file.type || "application/octet-stream",
    size: file.size,
    iv: bufToB64(iv),
    blob: new Blob([ct]),
    albumId: null,
    createdAt: Date.now(),
  };
}

export async function decryptFile(key: CryptoKey, row: FileRow): Promise<Blob> {
  const iv = new Uint8Array(b64ToBuf(row.iv));
  const ctBuf = await row.blob.arrayBuffer();
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, ctBuf);
  return new Blob([plain], { type: row.mime });
}

// CRUD helpers
export async function listAlbums(): Promise<AlbumRow[]> {
  const db = await getDB();
  const all = (await db.getAll("albums")) as AlbumRow[];
  return all.sort((a, b) => a.createdAt - b.createdAt);
}
export async function createAlbum(name: string): Promise<AlbumRow> {
  const db = await getDB();
  const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
  const row: AlbumRow = {
    id: crypto.randomUUID(),
    name,
    color: colors[Math.floor(Math.random() * colors.length)],
    createdAt: Date.now(),
  };
  await db.put("albums", row);
  return row;
}
export async function deleteAlbum(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("albums", id);
}

export async function listFiles(): Promise<FileRow[]> {
  const db = await getDB();
  const all = (await db.getAll("files")) as FileRow[];
  return all.sort((a, b) => b.createdAt - a.createdAt);
}
export async function saveFile(row: FileRow): Promise<void> {
  const db = await getDB();
  await db.put("files", row);
}
export async function deleteFileRow(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("files", id);
}
export async function updateFileAlbum(id: string, albumId: string | null): Promise<void> {
  const db = await getDB();
  const row = (await db.get("files", id)) as FileRow | undefined;
  if (!row) return;
  row.albumId = albumId;
  await db.put("files", row);
}

export async function logIntruder(): Promise<void> {
  const db = await getDB();
  await db.put("intruders", { id: crypto.randomUUID(), attemptedAt: Date.now() } as IntruderRow);
}
export async function listIntruders(): Promise<IntruderRow[]> {
  const db = await getDB();
  const all = (await db.getAll("intruders")) as IntruderRow[];
  return all.sort((a, b) => b.attemptedAt - a.attemptedAt).slice(0, 100);
}
export async function clearIntruders(): Promise<void> {
  const db = await getDB();
  await db.clear("intruders");
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const db = await getDB();
  const row = (await db.get("settings", key)) as SettingsRow | undefined;
  return (row?.value as T) ?? fallback;
}
export async function setSetting<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put("settings", { key, value } as SettingsRow);
}

export async function destroyVault(): Promise<void> {
  const db = await getDB();
  await Promise.all([
    db.clear("meta"),
    db.clear("albums"),
    db.clear("files"),
    db.clear("intruders"),
    db.clear("settings"),
  ]);
}
