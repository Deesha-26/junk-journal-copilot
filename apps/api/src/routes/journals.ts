import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();
export const journalsRouter = Router();

const CreateJournalSchema = z.object({
  title: z.string().min(1).max(80),
  themeFamily: z.string().min(1),
  pageSize: z.string().min(1),
  clutterLevel: z.string().optional(),
  agingLevel: z.string().optional(),
});

journalsRouter.get("/", async (req, res) => {
  const ownerId = req.ownerId!;
  const journals = await prisma.journal.findMany({
    where: { ownerId, archivedAt: null },
    orderBy: { updatedAt: "desc" },
  });
  res.json(journals);
});

journalsRouter.post("/", async (req, res) => {
  const ownerId = req.ownerId!;
  const parsed = CreateJournalSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const j = await prisma.journal.create({
    data: {
      ownerId,
      title: parsed.data.title,
      themeFamily: parsed.data.themeFamily,
      pageSize: parsed.data.pageSize,
      clutterLevel: parsed.data.clutterLevel ?? "medium",
      agingLevel: parsed.data.agingLevel ?? "soft",
    },
  });
  res.json(j);
});

journalsRouter.patch("/:id", async (req, res) => {
  const ownerId = req.ownerId!;
  const id = req.params.id;

  const schema = z.object({
    title: z.string().min(1).max(80).optional(),
    themeFamily: z.string().optional(),
    pageSize: z.string().optional(),
    clutterLevel: z.string().optional(),
    agingLevel: z.string().optional(),
    archivedAt: z.string().nullable().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const journal = await prisma.journal.findFirst({ where: { id, ownerId } });
  if (!journal) return res.status(404).json({ error: "Not found" });

  const updated = await prisma.journal.update({
    where: { id },
    data: {
      ...parsed.data,
      archivedAt:
        parsed.data.archivedAt
          ? new Date(parsed.data.archivedAt)
          : parsed.data.archivedAt === null
          ? null
          : undefined,
    },
  });
  res.json(updated);
});

journalsRouter.delete("/:id", async (req, res) => {
  const ownerId = req.ownerId!;
  const id = req.params.id;

  const journal = await prisma.journal.findFirst({ where: { id, ownerId } });
  if (!journal) return res.status(404).json({ error: "Not found" });

  await prisma.journal.update({ where: { id }, data: { archivedAt: new Date() } });
  res.json({ status: "ok" });
});
