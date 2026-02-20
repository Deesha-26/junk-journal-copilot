import express, { type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { z } from "zod";

import { env } from "./lib/env.js";
import { ownerMiddleware } from "./lib/owner.js";
import { ensureDir, storageRoot, entryMediaDir } from "./lib/storage.js";
import { beautifyImage } from "./lib/image.js";
import * as db from "./lib/db.js";

const E = env();
const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({ origin: E.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "20mb" }));
app.use(cookieParser());

ensureDir(storageRoot());
app.use("/storage", express.static(path.resolve(storageRoot())));

app.use(ownerMiddleware);

app.get("/api/health", (_req: Request, res: Response) => res.json({ status: "healthy" }));
app.get("/api/bootstrap", (req: Request, res: Response) => res.json({ status: "ok", ownerId: req.ownerId, noTraining: true }));

app.get("/api/journals", (req, res) => res.json(db.listJournals(req.ownerId!)));

app.post("/api/journals", (req, res) => {
  const schema = z.object({
    title: z.string().min(1).max(80),
    themeFamily: z.string().min(1),
    pageSize: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  res.json(db.createJournal(req.ownerId!, parsed.data));
});

app.delete("/api/journals/:id", (req, res) => {
  const ok = db.deleteJournal(req.ownerId!, req.params.id);
  if (!ok) return res.status(404).json({ error: "Not found" });
  res.json({ status: "ok" });
});

app.get("/api/entries/by-journal/:journalId", (req, res) => res.json(db.listEntries(req.ownerId!, req.params.journalId)));

app.post("/api/entries", (req, res) => {
  const schema = z.object({ journalId: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    res.json(db.createEntry(req.ownerId!, parsed.data.journalId));
  } catch (err: any) {
    res.status(404).json({ error: err?.message ?? "Journal not found" });
  }
});

app.get("/api/entries/:entryId", (req, res) => {
  const e = db.getEntry(req.ownerId!, req.params.entryId);
  if (!e) return res.status(404).json({ error: "Not found" });
  res.json(e);
});

app.post("/api/upload/:entryId", upload.array("files", 20), async (req, res) => {
  const entryId = req.params.entryId;
  const entry = db.getEntry(req.ownerId!, entryId);
  if (!entry) return res.status(404).json({ error: "Entry not found" });

  const files = (req.files as Express.Multer.File[]) ?? [];
  if (!files.length) return res.status(400).json({ error: "No files uploaded" });

  const outDir = entryMediaDir(req.ownerId!, entryId);
  ensureDir(outDir);

  const created: any[] = [];

  for (const f of files) {
    const rand = Math.random().toString(36).slice(2, 10);
    const ext = (path.extname(f.originalname || "") || ".jpg").toLowerCase();
    const baseName = `${Date.now()}_${rand}`;
    const rawName = `${baseName}${ext === ".jpeg" ? ".jpg" : ext}`;
    const rawPath = path.join(outDir, rawName);
    fs.writeFileSync(rawPath, f.buffer);

    const { outName } = await beautifyImage({
      ownerId: req.ownerId!,
      entryId,
      inputPath: rawPath,
      outputBaseName: baseName,
      trim: true,
    });

    const media = {
      id: baseName,
      createdAt: new Date().toISOString(),
      originalUrl: `/storage/media/${req.ownerId}/${entryId}/${rawName}`,
      derivedUrl: `/storage/media/${req.ownerId}/${entryId}/_derived/${outName}`,
    };

    db.addMedia(req.ownerId!, entryId, media);
    created.push(media);
  }

  res.json({ status: "ok", media: created });
});

app.get("/api/preview/:entryId", (req, res) => {
  const e = db.getEntry(req.ownerId!, req.params.entryId);
  if (!e) return res.status(404).json({ error: "Not found" });

  res.json({
    entryId: e.id,
    suggestedTitle: e.media.length ? "A small moment" : "New memory",
    suggestedDescription: e.media.length
      ? "A quick collage — approve, edit, or regenerate to make it yours."
      : "Upload photos to generate a junk journal page preview.",
    mediaSuggestions: e.media.map((m) => ({
      mediaAssetId: m.id,
      beforeUrl: m.originalUrl,
      afterUrl: m.derivedUrl,
      suggestedEdits: [{ type: "enhance" }, { type: "trim" }],
    })),
    pageOptions: [
      { id: "optA", name: "Option A • Cozy Layered" },
      { id: "optB", name: "Option B • Minimal Tape Corners" },
      { id: "optC", name: "Option C • Vintage Ledger" },
    ],
  });
});

app.post("/api/approve/:entryId", (req, res) => {
  const schema = z.object({
    chosenOptionId: z.enum(["optA", "optB", "optC"]),
    titleFinal: z.string().min(1).max(120),
    descFinal: z.string().max(500).optional().default(""),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const updated = db.approveEntry(req.ownerId!, req.params.entryId, {
      templateId: parsed.data.chosenOptionId,
      titleFinal: parsed.data.titleFinal,
      descFinal: parsed.data.descFinal,
    });
    res.json({ status: "ok", entry: updated });
  } catch (err: any) {
    res.status(404).json({ error: err?.message ?? "Not found" });
  }
});

app.post("/api/share", (req, res) => {
  const schema = z.object({ journalId: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const slug = `public_${parsed.data.journalId}`;
  res.json({ share: { mode: "public", slug } });
});

app.get("/api/share/public/:slug", (req, res) => {
  const slug = req.params.slug;
  if (!slug.startsWith("public_")) return res.status(404).json({ error: "Not found" });
  const journalId = slug.replace("public_", "");
  const j = db.listJournals(req.ownerId!).find((x) => x.id === journalId);
  if (!j) return res.status(404).json({ error: "Not found" });
  const entries = db.listEntries(req.ownerId!, journalId).filter((e) => e.status === "approved");
  res.json({ journal: j, entries });
});

app.get("/", (_req, res) => res.send("Junk Journal API is running 🚀"));

app.listen(Number(E.PORT), () => console.log(`🚀 API running on http://localhost:${E.PORT}`));
