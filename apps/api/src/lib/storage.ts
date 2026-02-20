import fs from "fs";
import path from "path";
import { env } from "./env.js";

export function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

export function storageRoot(): string {
  return path.resolve(env().STORAGE_DIR);
}

export function ownersDir(): string {
  return path.join(storageRoot(), "owners");
}

export function mediaRoot(): string {
  return path.join(storageRoot(), "media");
}

export function ownerFile(ownerId: string): string {
  return path.join(ownersDir(), `${ownerId}.json`);
}

export function entryMediaDir(ownerId: string, entryId: string): string {
  return path.join(mediaRoot(), ownerId, entryId);
}

export function entryDerivedDir(ownerId: string, entryId: string): string {
  return path.join(mediaRoot(), ownerId, entryId, "_derived");
}
