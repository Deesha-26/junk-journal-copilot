import fs from "fs";
import path from "path";
import { loadEnv } from "./env.js";

const env = loadEnv();

export function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

export function ownerEntryDir(ownerId: string, entryId: string) {
  return path.resolve(env.STORAGE_DIR, ownerId, entryId);
}

export function derivedDir(ownerId: string, entryId: string) {
  return path.resolve(env.STORAGE_DIR, ownerId, entryId, "_derived");
}

export function safeExt(originalName: string, fallback = ".jpg") {
  const ext = path.extname(originalName || "").toLowerCase();
  if (!ext || ext.length > 6) return fallback;
  if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) return fallback;
  return ext === ".jpeg" ? ".jpg" : ext;
}
