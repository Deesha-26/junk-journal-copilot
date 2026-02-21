// apps/api/src/server.ts
// Production-safe API for Render + Vercel frontend
// - Uses cookie-based anonymous "owner" (no auth) so each browser/device isolates data
// - File-backed JSON storage (no Prisma/DB needed for MVP)
// - Upload + "beautify" (sharp) + preview options + approve + book view
// - CORS supports localhost + your Vercel domain via env

import express, { type Request, type Response, type NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { z } from "zod";
import type { RequestHandler } from "express";

const upload = multer({ storage: multer.memoryStorage() });
const uploadFiles = upload.array("files", 20) as unknown as RequestHandler;
const app = express();


/** -----------------------------
 * Env
 * ------------------------------*/
const ENV = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 3001),
  COOKIE_NAME: process.env.COOKIE_NAME ?? "jj_token",
  STORAGE_DIR: process.env.STORAGE_DIR ?? path.resolve(process.cwd(), "storage"),
  // If you set this in Render to your Vercel URL, CORS will allow it.
  // Example: https://junk-journal-copilot.vercel.app
  CORS_ORIGIN: (process.env.CORS_ORIGIN ?? "").trim(),
};

const isProd = ENV.NODE_ENV === "production";

/** -----------------------------
 * Helpers
 * ------------------------------*/
function uuid() {
  return crypto.randomUUID();
}

function nowIso() {
  return new Date().toISOString();
}

async function ensureDir(p: string) {
  await fsp.mkdir(p, { recursive: true });
}

function ownerRoot(ownerId: string) {
  return path.join(ENV.STORAGE_DIR, "owners", ownerId);
}
function ownerDbPath(ownerId: string) {
  return path.join(ownerRoot(ownerId), "db.json");
}
function ownerMediaDir(ownerId: string) {
  return path.join(ownerRoot(ownerId), "media");
}

type Journal = {
  id: string;
  name: string;
  createdAt: string;
};

type MediaAsset = {
  id: string;
  createdAt: string;
  originalName: string;
  mimeType: string;
  size: number;
  // file basenames (inside owner media dir)
  originalFile: string;
  beautifiedFile: string;
  thumbFile: string;
};

type Entry = {
  id: string;
  journalId: string;
  createdAt: string;
  updatedAt: string;
  status: "draft" | "approved";
  title: string;
  description: string;
  template: string; // chosen template after approve; empty while draft
  mediaIds: string[];
  // last preview options cached
  lastPreview?: PreviewOptions;
};

type Share = {
  id: string; // shareId
  journalId: string;
  createdAt: string;
  // for MVP this is "public read" by shareId.
  // Later: permissions, expiry, etc.
};

type PreviewOption = {
  id: string; // option id
  style: "scrapbook" | "vintage" | "minimal";
  label: string;
  // minimal layout metadata the web can render
  layout: {
    background: string;
    frame: string;
    collage: "single" | "grid" | "stack";
    notesStyle: "handwritten" | "typewriter" | "clean";
  };
  suggestion: {
    title: string;
    description: string;
  };
};

type PreviewOptions = {
  createdAt: string;
  options: PreviewOption[];
};

type OwnerDB = {
  schemaVersion: 1;
  ownerId: string;
  createdAt: string;
  journals: Journal[];
  entries: Entry[];
  media: MediaAsset[];
  shares: Share[];
};

async function loadOwnerDB(ownerId: string): Promise<OwnerDB> {
  await ensureDir(ownerRoot(ownerId));
  await ensureDir(ownerMediaDir(ownerId));

  const p = ownerDbPath(ownerId);
  if (!fs.existsSync(p)) {
    const fresh: OwnerDB = {
      schemaVersion: 1,
      ownerId,
      createdAt: nowIso(),
      journals: [],
      entries: [],
      media: [],
      shares: [],
    };
    await fsp.writeFile(p, JSON.stringify(fresh, null, 2), "utf-8");
    return fresh;
  }

  const raw = await fsp.readFile(p, "utf-8");
  return JSON.parse(raw) as OwnerDB;
}

async function saveOwnerDB(ownerId: string, db: OwnerDB) {
  await ensureDir(ownerRoot(ownerId));
  await fsp.writeFile(ownerDbPath(ownerId), JSON.stringify(db, null, 2), "utf-8");
}

function publicApiBase(req: Request) {
  // For absolute URLs if needed. Not strictly required for Vercel.
  const proto =
    (req.headers["x-forwarded-proto"] as string | undefined) ??
    (req.secure ? "https" : "http");
  const host =
    (req.headers["x-forwarded-host"] as string | undefined) ??
    (req.headers.host as string | undefined) ??
    `localhost:${ENV.PORT}`;
  return `${proto}://${host}`;
}

/** -----------------------------
 * CORS (Render + Vercel friendly)
 * ------------------------------*/
function isAllowedOrigin(origin: string) {
  // Allow explicit origin from env (recommended)
  if (ENV.CORS_ORIGIN && origin === ENV.CORS_ORIGIN) return true;

  // Allow Vercel preview & prod domains (common pattern)
  // e.g. https://myapp.vercel.app or https://myapp-git-branch-user.vercel.app
  if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return true;

  // Local dev
  if (origin === "http://localhost:3000") return true;
  if (origin === "http://127.0.0.1:3000") return true;

  return false;
}

app.set("trust proxy", 1);

app.use(
  cors({
    origin: (origin, cb) => {
      // Server-to-server or curl requests can have no Origin
      if (!origin) return cb(null, true);
      if (isAllowedOrigin(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "12mb" }));
app.use(cookieParser() as unknown as RequestHandler);

/** -----------------------------
 * Anonymous owner (per browser)
 * ------------------------------*/
type OwnerRequest = Request & { ownerId?: string };

function setOwnerCookie(res: Response, ownerId: string) {
  // secure cookies in prod (https). On Render behind proxy, req.secure may be false unless trust proxy is set (it is).
  res.cookie(ENV.COOKIE_NAME, ownerId, {
    httpOnly: true,
    sameSite: "none",
    secure: isProd,
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
  });
}

function ownerMiddleware(req: OwnerRequest, res: Response, next: NextFunction) {
  let token = req.cookies?.[ENV.COOKIE_NAME] as string | undefined;

  if (!token || typeof token !== "string" || token.length < 10) {
    token = uuid();
    setOwnerCookie(res, token);
  }
  req.ownerId = token;
  next();
}

app.use(ownerMiddleware);

/** -----------------------------
 * Multer (uploads)
 * ------------------------------*/
// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: {
//     files: 20,
//     fileSize: 15 * 1024 * 1024, // 15MB each
//   },
// });

/** -----------------------------
 * Zod schemas
 * ------------------------------*/
const createJournalSchema = z.object({
  name: z.string().min(1).max(80),
});

const createEntrySchema = z.object({
  journalId: z.string().min(1),
});

const approveEntrySchema = z.object({
  template: z.string().min(1).max(40),
  title: z.string().min(1).max(120),
  description: z.string().min(0).max(2000),
});

const previewSchema = z.object({
  // the “style family” can be chosen by user in UI later
  mode: z.enum(["scrapbook", "vintage", "minimal"]).optional(),
});

/** -----------------------------
 * Image processing
 * ------------------------------*/
async function beautifyAndSaveImage(
  ownerId: string,
  inputBuffer: Buffer,
  mimeType: string,
  baseId: string
): Promise<{ originalFile: string; beautifiedFile: string; thumbFile: string }> {
  const mediaDir = ownerMediaDir(ownerId);
  await ensureDir(mediaDir);

  const ext =
    mimeType === "image/png"
      ? "png"
      : mimeType === "image/webp"
        ? "webp"
        : "jpg";

  const originalFile = `${baseId}.orig.${ext}`;
  const beautifiedFile = `${baseId}.beaut.${ext}`;
  const thumbFile = `${baseId}.thumb.${ext}`;

  const originalPath = path.join(mediaDir, originalFile);
  const beautPath = path.join(mediaDir, beautifiedFile);
  const thumbPath = path.join(mediaDir, thumbFile);

  // Save original as-is
  await fsp.writeFile(originalPath, inputBuffer);

  // Beautify: rotate based on EXIF, mild normalize, auto-trim edges, resize to sane max
  // Note: “leaf edge masking” is non-trivial; MVP does robust auto-trim + crop preview options.
  const pipeline = sharp(inputBuffer).rotate();

  // produce beautified
  await pipeline
    .clone()
    .normalize()
    .trim({ threshold: 10 })
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .toFile(beautPath);

  // thumbnail
  await pipeline
    .clone()
    .resize({ width: 420, height: 420, fit: "cover" })
    .toFile(thumbPath);

  return { originalFile, beautifiedFile, thumbFile };
}

function suggestTitleAndDescription(entry: Entry, mediaCount: number) {
  // Simple heuristic MVP. Later: connect LLM.
  const base = mediaCount === 1 ? "A small moment" : `A collage of ${mediaCount} moments`;
  const title = entry.title?.trim() ? entry.title : base;
  const description =
    entry.description?.trim() ||
    "A cozy memory captured in textures, color, and little details. (Edit anytime.)";
  return { title, description };
}

function buildPreviewOptions(entry: Entry, mediaCount: number): PreviewOptions {
  const s = suggestTitleAndDescription(entry, mediaCount);

  return {
    createdAt: nowIso(),
    options: [
      {
        id: "opt_scrapbook",
        style: "scrapbook",
        label: "Scrapbook (collage + tape)",
        layout: {
          background: "paper-warm",
          frame: "tape-corners",
          collage: mediaCount <= 1 ? "single" : "grid",
          notesStyle: "handwritten",
        },
        suggestion: {
          title: s.title,
          description: s.description,
        },
      },
      {
        id: "opt_vintage",
        style: "vintage",
        label: "Vintage (sepia paper + typewriter)",
        layout: {
          background: "paper-sepia",
          frame: "vintage-border",
          collage: mediaCount <= 2 ? "stack" : "grid",
          notesStyle: "typewriter",
        },
        suggestion: {
          title: s.title,
          description: s.description,
        },
      },
      {
        id: "opt_minimal",
        style: "minimal",
        label: "Minimal (clean margins)",
        layout: {
          background: "paper-clean",
          frame: "simple-shadow",
          collage: "single",
          notesStyle: "clean",
        },
        suggestion: {
          title: s.title,
          description: s.description,
        },
      },
    ],
  };
}

/** -----------------------------
 * Routes
 * ------------------------------*/
app.get("/", (_req, res) => {
  res.type("text/plain").send("Junk Journal API is running 🚀");
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "healthy" });
});

app.get("/api/bootstrap", async (req: OwnerRequest, res) => {
  // Ensures cookie exists + storage initialized
  const ownerId = req.ownerId!;
  await loadOwnerDB(ownerId);
  res.json({ status: "ok", ownerId });
});

/** Journals */
app.get("/api/journals", async (req: OwnerRequest, res) => {
  const db = await loadOwnerDB(req.ownerId!);
  res.json({ journals: db.journals });
});

app.post("/api/journals", async (req: OwnerRequest, res) => {
  const ownerId = req.ownerId!;
  const parsed = createJournalSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const db = await loadOwnerDB(ownerId);
  const j: Journal = { id: uuid(), name: parsed.data.name, createdAt: nowIso() };
  db.journals.unshift(j);
  await saveOwnerDB(ownerId, db);

  res.json({ journal: j });
});

app.delete("/api/journals/:journalId", async (req: OwnerRequest, res) => {
  const ownerId = req.ownerId!;
  const journalId = req.params.journalId;

  const db = await loadOwnerDB(ownerId);
  const before = db.journals.length;
  db.journals = db.journals.filter((j) => j.id !== journalId);

  // cascade: entries (and their media)
  const toDeleteEntries = db.entries.filter((e) => e.journalId === journalId);
  const toDeleteMediaIds = new Set<string>();
  for (const e of toDeleteEntries) for (const mid of e.mediaIds) toDeleteMediaIds.add(mid);

  db.entries = db.entries.filter((e) => e.journalId !== journalId);
  const removedMedia = db.media.filter((m) => toDeleteMediaIds.has(m.id));
  db.media = db.media.filter((m) => !toDeleteMediaIds.has(m.id));

  // delete files on disk (best-effort)
  const mediaDir = ownerMediaDir(ownerId);
  await Promise.all(
    removedMedia.flatMap((m) =>
      [m.originalFile, m.beautifiedFile, m.thumbFile].map(async (f) => {
        try {
          await fsp.unlink(path.join(mediaDir, f));
        } catch {
          /* ignore */
        }
      })
    )
  );

  await saveOwnerDB(ownerId, db);

  if (db.journals.length === before) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

/** Entries */
app.get("/api/journals/:journalId/entries", async (req: OwnerRequest, res) => {
  const ownerId = req.ownerId!;
  const journalId = req.params.journalId;

  const db = await loadOwnerDB(ownerId);
  const entries = db.entries
    .filter((e) => e.journalId === journalId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  res.json({ entries });
});

app.post("/api/entries", async (req: OwnerRequest, res) => {
  const ownerId = req.ownerId!;
  const parsed = createEntrySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const db = await loadOwnerDB(ownerId);
  const journal = db.journals.find((j) => j.id === parsed.data.journalId);
  if (!journal) return res.status(404).json({ error: "Journal not found" });

  const e: Entry = {
    id: uuid(),
    journalId: journal.id,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    status: "draft",
    title: "",
    description: "",
    template: "",
    mediaIds: [],
  };

  db.entries.unshift(e);
  await saveOwnerDB(ownerId, db);
  res.json({ entry: e });
});

app.get("/api/entries/:entryId", async (req: OwnerRequest, res) => {
  const ownerId = req.ownerId!;
  const entryId = req.params.entryId;

  const db = await loadOwnerDB(ownerId);
  const entry = db.entries.find((e) => e.id === entryId);
  if (!entry) return res.status(404).json({ error: "Not found" });

  res.json({ entry });
});

/** Upload media to an entry */
app.post(
  "/api/entries/:entryId/media",
  uploadFiles,
  async (req: OwnerRequest, res: Response) => {
    const ownerId = req.ownerId!;
    const entryId = req.params.entryId;

    const db = await loadOwnerDB(ownerId);
    const entry = db.entries.find((e) => e.id === entryId);
    if (!entry) return res.status(404).json({ error: "Entry not found" });

    const files = (req.files ?? []) as Express.Multer.File[];
    if (files.length === 0) return res.status(400).json({ error: "No files uploaded" });

    const saved: MediaAsset[] = [];

    for (const f of files) {
      const mimeType = f.mimetype || "image/jpeg";
      if (!mimeType.startsWith("image/")) {
        return res.status(400).json({ error: `Unsupported file type: ${mimeType}` });
      }

      const id = uuid();
      const { originalFile, beautifiedFile, thumbFile } = await beautifyAndSaveImage(
        ownerId,
        f.buffer,
        mimeType,
        id
      );

      const m: MediaAsset = {
        id,
        createdAt: nowIso(),
        originalName: f.originalname,
        mimeType,
        size: f.size,
        originalFile,
        beautifiedFile,
        thumbFile,
      };

      db.media.push(m);
      entry.mediaIds.push(m.id);
      entry.updatedAt = nowIso();
      saved.push(m);
    }

    await saveOwnerDB(ownerId, db);

    res.json({ ok: true, media: saved, entry });
  }
);

/** Serve media files securely (only owner can access) */
app.get("/api/media/:mediaId/:variant", async (req: OwnerRequest, res) => {
  const ownerId = req.ownerId!;
  const mediaId = req.params.mediaId;
  const variant = req.params.variant; // original|beaut|thumb

  const db = await loadOwnerDB(ownerId);
  const m = db.media.find((x) => x.id === mediaId);
  if (!m) return res.status(404).json({ error: "Not found" });

  const filename =
    variant === "original"
      ? m.originalFile
      : variant === "thumb"
        ? m.thumbFile
        : m.beautifiedFile;

  const p = path.join(ownerMediaDir(ownerId), filename);
  if (!fs.existsSync(p)) return res.status(404).json({ error: "File missing" });

  res.setHeader("Content-Type", m.mimeType);
  res.setHeader("Cache-Control", "private, max-age=3600");
  fs.createReadStream(p).pipe(res);
});

/** Generate preview options (3 templates) for an entry */
app.post("/api/entries/:entryId/preview", async (req: OwnerRequest, res) => {
  const ownerId = req.ownerId!;
  const entryId = req.params.entryId;

  const parsed = previewSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const db = await loadOwnerDB(ownerId);
  const entry = db.entries.find((e) => e.id === entryId);
  if (!entry) return res.status(404).json({ error: "Entry not found" });

  const media = entry.mediaIds
    .map((id) => db.media.find((m) => m.id === id))
    .filter(Boolean) as MediaAsset[];

  const preview = buildPreviewOptions(entry, media.length);
  entry.lastPreview = preview;
  entry.updatedAt = nowIso();
  await saveOwnerDB(ownerId, db);

  // Provide URLs web can render
  const base = publicApiBase(req);
  const mediaForUI = media.map((m) => ({
    id: m.id,
    originalName: m.originalName,
    thumbUrl: `${base}/api/media/${m.id}/thumb`,
    beautifiedUrl: `${base}/api/media/${m.id}/beaut`,
    originalUrl: `${base}/api/media/${m.id}/original`,
  }));

  res.json({
    entry,
    media: mediaForUI,
    preview,
  });
});

/** Approve an entry (lock template + title/description) */
app.post("/api/entries/:entryId/approve", async (req: OwnerRequest, res) => {
  const ownerId = req.ownerId!;
  const entryId = req.params.entryId;

  const parsed = approveEntrySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const db = await loadOwnerDB(ownerId);
  const entry = db.entries.find((e) => e.id === entryId);
  if (!entry) return res.status(404).json({ error: "Entry not found" });

  entry.status = "approved";
  entry.template = parsed.data.template;
  entry.title = parsed.data.title;
  entry.description = parsed.data.description;
  entry.updatedAt = nowIso();
  await saveOwnerDB(ownerId, db);

  res.json({ ok: true, entry });
});

/** “Book view” for a journal (flipbook UI consumes this) */
app.get("/api/journals/:journalId/book", async (req: OwnerRequest, res) => {
  const ownerId = req.ownerId!;
  const journalId = req.params.journalId;

  const db = await loadOwnerDB(ownerId);
  const journal = db.journals.find((j) => j.id === journalId);
  if (!journal) return res.status(404).json({ error: "Journal not found" });

  const base = publicApiBase(req);

  const entries = db.entries
    .filter((e) => e.journalId === journalId && e.status === "approved")
    .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));

  const pages = entries.map((e) => {
    const media = e.mediaIds
      .map((id) => db.media.find((m) => m.id === id))
      .filter(Boolean) as MediaAsset[];

    return {
      entryId: e.id,
      title: e.title,
      description: e.description,
      template: e.template || "scrapbook",
      createdAt: e.createdAt,
      images: media.map((m) => ({
        id: m.id,
        url: `${base}/api/media/${m.id}/beaut`,
        thumbUrl: `${base}/api/media/${m.id}/thumb`,
        originalName: m.originalName,
      })),
    };
  });

  res.json({
    journal: { id: journal.id, name: journal.name, createdAt: journal.createdAt },
    pages,
  });
});

/** Share stub (public link) */
app.post("/api/journals/:journalId/share", async (req: OwnerRequest, res) => {
  const ownerId = req.ownerId!;
  const journalId = req.params.journalId;

  const db = await loadOwnerDB(ownerId);
  const journal = db.journals.find((j) => j.id === journalId);
  if (!journal) return res.status(404).json({ error: "Journal not found" });

  const share: Share = { id: uuid(), journalId, createdAt: nowIso() };
  db.shares.push(share);
  await saveOwnerDB(ownerId, db);

  const base = publicApiBase(req);
  res.json({ shareUrl: `${base}/share/${share.id}` });
});

// Public share read (no cookie required). MVP only.
app.get("/share/:shareId", async (req, res) => {
  // Very lightweight: serve a JSON payload the web can use to render a read-only view later
  const shareId = req.params.shareId;

  // We need to search owners to find this share. MVP approach: scan directories (OK for small scale).
  // Later: DB index.
  const ownersDir = path.join(ENV.STORAGE_DIR, "owners");
  if (!fs.existsSync(ownersDir)) return res.status(404).json({ error: "Not found" });

  const ownerIds = await fsp.readdir(ownersDir);
  for (const oid of ownerIds) {
    try {
      const db = await loadOwnerDB(oid);
      const share = db.shares.find((s) => s.id === shareId);
      if (!share) continue;

      const journal = db.journals.find((j) => j.id === share.journalId);
      if (!journal) return res.status(404).json({ error: "Not found" });

      // Reuse book view payload (but media URLs here would require auth; for MVP share is a stub)
      return res.json({
        ok: true,
        shareId,
        journal: { id: journal.id, name: journal.name, createdAt: journal.createdAt },
        note: "Share view stub. Wire this to public media hosting later (S3/R2) for real sharing.",
      });
    } catch {
      // ignore and keep scanning
    }
  }

  return res.status(404).json({ error: "Not found" });
});

/** -----------------------------
 * Error handler
 * ------------------------------*/
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const message = typeof err?.message === "string" ? err.message : "Server error";
  res.status(500).json({ error: message });
});

/** -----------------------------
 * Start
 * ------------------------------*/
async function main() {
  await ensureDir(ENV.STORAGE_DIR);
  app.listen(ENV.PORT, () => {
    console.log(`🚀 API running on http://localhost:${ENV.PORT}`);
    if (ENV.CORS_ORIGIN) console.log(`✅ CORS_ORIGIN=${ENV.CORS_ORIGIN}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});