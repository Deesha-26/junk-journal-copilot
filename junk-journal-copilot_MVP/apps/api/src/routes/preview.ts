import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const previewRouter = Router();

function svgOption(label: string, theme: string, pageSize: string) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='900' height='1200'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='#f4efe6'/><stop offset='100%' stop-color='#e8ddc7'/>
      </linearGradient>
      <filter id='shadow' x='-20%' y='-20%' width='140%' height='140%'>
        <feDropShadow dx='0' dy='4' stdDeviation='8' flood-color='rgba(0,0,0,0.25)'/>
      </filter>
    </defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <text x='64' y='120' font-size='48' fill='#2b2420' font-family='Georgia, serif'>${label}</text>
    <text x='64' y='178' font-size='22' fill='#2b2420' opacity='0.7' font-family='Georgia, serif'>${theme} • ${pageSize}</text>
    <g filter='url(#shadow)'>
      <rect x='64' y='240' width='772' height='880' rx='28' fill='rgba(255,255,255,0.38)' stroke='rgba(43,36,32,0.20)'/>
    </g>
    <text x='96' y='312' font-size='20' fill='#2b2420' opacity='0.75' font-family='Georgia, serif'>MVP preview placeholder (real compositor is next).</text>
  </svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

previewRouter.get("/:entryId", async (req, res) => {
  const ownerId = req.ownerId!;
  const entryId = req.params.entryId;

  const entry = await prisma.entry.findFirst({
    where: { id: entryId, ownerId },
    include: { journal: true, media: true },
  });
  if (!entry) return res.status(404).json({ error: "Entry not found" });

  if (!entry.media.length) {
    return res.json({
      entryId,
      suggestedTitle: "New memory",
      suggestedDescription: "Upload photos to generate a junk journal page preview.",
      mediaSuggestions: [],
      pageOptions: [],
    });
  }

  const mediaSuggestions = entry.media.map((m) => ({
    mediaAssetId: m.id,
    kind: m.kind,
    beforeUrl: `/storage${m.originalUrl}`,
    afterUrl: `/storage${m.derivedUrl ?? m.originalUrl}`,
    suggestedEdits: [
      { type: "enhance", strength: "medium" },
      { type: "mask_object", mode: "medium" },
      { type: "crop_rect", x: 0.05, y: 0.05, w: 0.9, h: 0.9 },
    ],
  }));

  const pageOptions = [
    { id: "optA", name: "Option A • Layered Cozy", previewImageUrl: svgOption("Option A", entry.journal.themeFamily, entry.journal.pageSize) },
    { id: "optB", name: "Option B • Minimal Tape Corners", previewImageUrl: svgOption("Option B", entry.journal.themeFamily, entry.journal.pageSize) },
    { id: "optC", name: "Option C • Vintage Ledger", previewImageUrl: svgOption("Option C", entry.journal.themeFamily, entry.journal.pageSize) },
  ];

  res.json({
    entryId,
    suggestedTitle: "A small moment",
    suggestedDescription: "A quick collage of today’s highlights — approve or edit to make it yours.",
    mediaSuggestions,
    pageOptions,
  });
});
