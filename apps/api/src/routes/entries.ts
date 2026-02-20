import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();
export const entriesRouter = Router();

const CreateEntrySchema = z.object({ journalId: z.string().uuid() });

entriesRouter.get("/by-journal/:journalId", async (req, res) => {
  const ownerId = req.ownerId!;
  const journalId = req.params.journalId;

  const journal = await prisma.journal.findFirst({ where: { id: journalId, ownerId, archivedAt: null } });
  if (!journal) return res.status(404).json({ error: "Journal not found" });

  const entries = await prisma.entry.findMany({
    where: { ownerId, journalId },
    orderBy: { createdAt: "desc" },
    include: {
      media: true,
      versions: { orderBy: { versionNum: "desc" }, take: 1 },
    },
  });

  res.json(
    entries.map((e) => ({
      id: e.id,
      journalId: e.journalId,
      status: e.status,
      createdAt: e.createdAt,
      titleFinal: e.titleFinal,
      descFinal: e.descFinal,
      mediaCount: e.media.length,
      currentVersion: e.versions[0]
        ? { id: e.versions[0].id, versionNum: e.versions[0].versionNum, templateId: e.versions[0].templateId, pageRenders: e.versions[0].pageRenders }
        : null,
    }))
  );
});

entriesRouter.post("/", async (req, res) => {
  const ownerId = req.ownerId!;
  const parsed = CreateEntrySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const journal = await prisma.journal.findFirst({ where: { id: parsed.data.journalId, ownerId, archivedAt: null } });
  if (!journal) return res.status(404).json({ error: "Journal not found" });

  const entry = await prisma.entry.create({
    data: { ownerId, journalId: parsed.data.journalId, status: "draft" },
  });

  res.json(entry);
});

entriesRouter.patch("/:entryId", async (req, res) => {
  const ownerId = req.ownerId!;
  const entryId = req.params.entryId;

  const schema = z.object({
    titleFinal: z.string().max(120).optional(),
    descFinal: z.string().max(500).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const entry = await prisma.entry.findFirst({ where: { id: entryId, ownerId } });
  if (!entry) return res.status(404).json({ error: "Entry not found" });

  const updated = await prisma.entry.update({ where: { id: entryId }, data: { ...parsed.data } });
  res.json(updated);
});
