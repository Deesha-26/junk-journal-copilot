import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { randomToken } from "../lib/crypto.js";

const prisma = new PrismaClient();
export const shareRouter = Router();

const CreateShareSchema = z.object({
  journalId: z.string().uuid(),
  mode: z.enum(["public", "invite"]),
});

shareRouter.post("/", async (req, res) => {
  const ownerId = req.ownerId!;
  const parsed = CreateShareSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const journal = await prisma.journal.findFirst({ where: { id: parsed.data.journalId, ownerId, archivedAt: null } });
  if (!journal) return res.status(404).json({ error: "Journal not found" });

  const slug = randomToken(16);
  const share = await prisma.share.create({
    data: { ownerId, journalId: journal.id, mode: parsed.data.mode, slug, enabled: true },
  });

  res.json({ share });
});

const InviteSchema = z.object({
  shareId: z.string().uuid(),
  email: z.string().email().optional(),
});

shareRouter.post("/invite", async (req, res) => {
  const ownerId = req.ownerId!;
  const parsed = InviteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const share = await prisma.share.findFirst({ where: { id: parsed.data.shareId, ownerId, enabled: true, revokedAt: null } });
  if (!share) return res.status(404).json({ error: "Share not found" });

  const inviteSlug = randomToken(16);
  const inv = await prisma.shareInvite.create({
    data: { shareId: share.id, email: parsed.data.email, inviteSlug },
  });

  res.json({ invite: inv });
});

shareRouter.get("/public/:slug", async (req, res) => {
  const slug = req.params.slug;
  const share = await prisma.share.findFirst({
    where: { slug, mode: "public", enabled: true, revokedAt: null },
    include: {
      journal: {
        include: {
          entries: {
            where: { status: "approved" },
            orderBy: { createdAt: "asc" },
            include: { versions: { orderBy: { versionNum: "desc" }, take: 1 } },
          },
        },
      },
    },
  });
  if (!share) return res.status(404).json({ error: "Not found" });

  res.json({
    journal: { id: share.journal.id, title: share.journal.title, pageSize: share.journal.pageSize, themeFamily: share.journal.themeFamily },
    entries: share.journal.entries.map((e) => ({
      id: e.id,
      title: e.titleFinal,
      desc: e.descFinal,
      version: e.versions[0]
        ? { id: e.versions[0].id, versionNum: e.versions[0].versionNum, templateId: e.versions[0].templateId, pageRenders: e.versions[0].pageRenders }
        : null,
    })),
  });
});

shareRouter.get("/invite/:inviteSlug", async (req, res) => {
  const inviteSlug = req.params.inviteSlug;
  const invite = await prisma.shareInvite.findFirst({
    where: { inviteSlug, revokedAt: null },
    include: {
      share: {
        include: {
          journal: {
            include: {
              entries: {
                where: { status: "approved" },
                orderBy: { createdAt: "asc" },
                include: { versions: { orderBy: { versionNum: "desc" }, take: 1 } },
              },
            },
          },
        },
      },
    },
  });
  if (!invite || !invite.share.enabled || invite.share.revokedAt) return res.status(404).json({ error: "Not found" });

  res.json({
    journal: { id: invite.share.journal.id, title: invite.share.journal.title, pageSize: invite.share.journal.pageSize, themeFamily: invite.share.journal.themeFamily },
    entries: invite.share.journal.entries.map((e) => ({
      id: e.id,
      title: e.titleFinal,
      desc: e.descFinal,
      version: e.versions[0]
        ? { id: e.versions[0].id, versionNum: e.versions[0].versionNum, templateId: e.versions[0].templateId, pageRenders: e.versions[0].pageRenders }
        : null,
    })),
  });
});
