import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();
export const approveRouter = Router();

const ApproveSchema = z.object({
  chosenOptionId: z.enum(["optA", "optB", "optC"]),
  titleFinal: z.string().max(120).optional(),
  descFinal: z.string().max(500).optional(),
  decisions: z.record(z.any()).optional(),
});

approveRouter.post("/:entryId", async (req, res) => {
  const ownerId = req.ownerId!;
  const entryId = req.params.entryId;

  const parsed = ApproveSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const entry = await prisma.entry.findFirst({
    where: { id: entryId, ownerId },
    include: { versions: true },
  });
  if (!entry) return res.status(404).json({ error: "Entry not found" });

  const latest = await prisma.entryVersion.findFirst({
    where: { ownerId, entryId },
    orderBy: { versionNum: "desc" },
  });
  const nextVersion = (latest?.versionNum ?? 0) + 1;

  const manifestUrl = `render-manifests://${entryId}/v${nextVersion}`;
  const pageRenders = [{ url: `placeholder://${parsed.data.chosenOptionId}` }];

  const version = await prisma.entryVersion.create({
    data: {
      ownerId,
      entryId,
      versionNum: nextVersion,
      templateId: parsed.data.chosenOptionId,
      decisionsJson: parsed.data.decisions ?? {},
      renderManifestUrl: manifestUrl,
      pageRenders,
      approvedAt: new Date(),
    },
  });

  const updated = await prisma.entry.update({
    where: { id: entryId },
    data: {
      status: "approved",
      currentVersionId: version.id,
      titleFinal: parsed.data.titleFinal ?? entry.titleFinal ?? "Untitled",
      descFinal: parsed.data.descFinal ?? entry.descFinal ?? "",
    },
  });

  res.json({
    status: "ok",
    entry: updated,
    version: { id: version.id, versionNum: version.versionNum, templateId: version.templateId, pageRenders: version.pageRenders },
  });
});
