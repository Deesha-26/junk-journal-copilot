import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { randomToken } from "../lib/crypto.js";
import { ensureDir, ownerEntryDir, safeExt } from "../lib/storage.js";
import { createDerivedImage } from "../lib/image_pipeline.js";

const prisma = new PrismaClient();
export const uploadRouter = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

uploadRouter.post("/:entryId", upload.array("files", 20), async (req, res) => {
  const ownerId = req.ownerId!;
  const entryId = req.params.entryId;

  const entry = await prisma.entry.findFirst({ where: { id: entryId, ownerId } });
  if (!entry) return res.status(404).json({ error: "Entry not found" });

  const files = (req.files as Express.Multer.File[]) ?? [];
  if (!files.length) return res.status(400).json({ error: "No files uploaded" });

  const outDir = ownerEntryDir(ownerId, entryId);
  ensureDir(outDir);

  const created = [];
  for (const f of files) {
    const ext = safeExt(f.originalname, ".jpg");
    const name = `${Date.now()}_${randomToken(6)}${ext}`;
    const full = path.join(outDir, name);
    fs.writeFileSync(full, f.buffer);

    const originalUrl = `/${ownerId}/${entryId}/${name}`; // served under /storage

    const derivedName = `${name.replace(ext, "")}_enh.jpg`;
    const derived = await createDerivedImage({
      ownerId,
      entryId,
      inputPath: full,
      outputName: derivedName,
      maxDim: 1800,
      trim: true,
      enhanceStrength: "medium",
    });

    const media = await prisma.mediaAsset.create({
      data: {
        ownerId,
        entryId,
        originalUrl,
        derivedUrl: derived.derivedRelUrl,
        kind: "unknown",
        exifStripped: true,
      },
    });
    created.push(media);
  }

  res.json({ status: "ok", media: created });
});
