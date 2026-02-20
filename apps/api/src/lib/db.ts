import fs from "fs";
import { ensureDir, ownersDir, ownerFile } from "./storage.js";

export type Journal = {
  id: string;
  title: string;
  themeFamily: string;
  pageSize: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type Media = {
  id: string;
  originalUrl: string;
  derivedUrl: string;
  createdAt: string;
};

export type Entry = {
  id: string;
  journalId: string;
  status: "draft" | "approved";
  titleFinal?: string;
  descFinal?: string;
  createdAt: string;
  updatedAt: string;
  media: Media[];
  approvedTemplateId?: string;
};

type OwnerDoc = {
  ownerId: string;
  journals: Journal[];
  entries: Entry[];
};

function nowIso() {
  return new Date().toISOString();
}

function id12(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < 12; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function loadOwner(ownerId: string): OwnerDoc {
  ensureDir(ownersDir());
  const f = ownerFile(ownerId);
  if (!fs.existsSync(f)) {
    const doc: OwnerDoc = { ownerId, journals: [], entries: [] };
    fs.writeFileSync(f, JSON.stringify(doc, null, 2), "utf-8");
    return doc;
  }
  return JSON.parse(fs.readFileSync(f, "utf-8")) as OwnerDoc;
}

export function saveOwner(doc: OwnerDoc) {
  ensureDir(ownersDir());
  fs.writeFileSync(ownerFile(doc.ownerId), JSON.stringify(doc, null, 2), "utf-8");
}

export function listJournals(ownerId: string) {
  return loadOwner(ownerId).journals.filter(j => !j.deletedAt);
}

export function createJournal(ownerId: string, data: { title: string; themeFamily: string; pageSize: string }): Journal {
  const doc = loadOwner(ownerId);
  const j: Journal = {
    id: id12(),
    title: data.title,
    themeFamily: data.themeFamily,
    pageSize: data.pageSize,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    deletedAt: null
  };
  doc.journals.unshift(j);
  saveOwner(doc);
  return j;
}

export function deleteJournal(ownerId: string, journalId: string): boolean {
  const doc = loadOwner(ownerId);
  const j = doc.journals.find(x => x.id === journalId && !x.deletedAt);
  if (!j) return false;
  j.deletedAt = nowIso();
  j.updatedAt = nowIso();
  saveOwner(doc);
  return true;
}

export function listEntries(ownerId: string, journalId: string) {
  return loadOwner(ownerId).entries.filter(e => e.journalId === journalId);
}

export function createEntry(ownerId: string, journalId: string): Entry {
  const doc = loadOwner(ownerId);
  const j = doc.journals.find(x => x.id === journalId && !x.deletedAt);
  if (!j) throw new Error("Journal not found");
  const e: Entry = {
    id: id12(),
    journalId,
    status: "draft",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    media: []
  };
  doc.entries.unshift(e);
  saveOwner(doc);
  return e;
}

export function getEntry(ownerId: string, entryId: string) {
  return loadOwner(ownerId).entries.find(e => e.id === entryId);
}

export function addMedia(ownerId: string, entryId: string, media: Media) {
  const doc = loadOwner(ownerId);
  const e = doc.entries.find(x => x.id === entryId);
  if (!e) throw new Error("Entry not found");
  e.media.unshift(media);
  e.updatedAt = nowIso();
  saveOwner(doc);
}

export function approveEntry(ownerId: string, entryId: string, data: { templateId: string; titleFinal: string; descFinal: string }) {
  const doc = loadOwner(ownerId);
  const e = doc.entries.find(x => x.id === entryId);
  if (!e) throw new Error("Entry not found");
  e.status = "approved";
  e.approvedTemplateId = data.templateId;
  e.titleFinal = data.titleFinal;
  e.descFinal = data.descFinal;
  e.updatedAt = nowIso();
  saveOwner(doc);
  return e;
}
