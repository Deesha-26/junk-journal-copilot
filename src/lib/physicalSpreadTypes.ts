import { z } from "zod";

const PageSideSchema = z.enum(["single", "left", "right"]);
const PlacementSchema = z.enum([
  "top-left",
  "top",
  "top-right",
  "center-left",
  "center",
  "center-right",
  "bottom-left",
  "bottom",
  "bottom-right"
]);

const ZoneSchema = z.object({
  zoneId: z.enum([
    "anchor",
    "clusterA",
    "clusterB",
    "journalBlock",
    "captionStrip",
    "pocket"
  ]),
  page: PageSideSchema,
  placement: PlacementSchema,
  description: z.string().min(1)
});

const LayerStepSchema = z.object({
  step: z.number().int().min(1),
  page: PageSideSchema,
  action: z.enum([
    "place",
    "tear",
    "tape",
    "glue",
    "label",
    "write",
    "pocket_build"
  ]),
  target: z.string().min(1),
  method: z.string().min(1),
  rationale: z.string().min(1)
});

const TapeUseSchema = z.object({
  useFor: z.string().min(1),
  technique: z.string().min(1),
  notes: z.string().min(1)
});

export const PhysicalSpreadPlanSchema = z.object({
  spreadMode: z.enum(["single", "two_page"]),
  pageFormat: z.enum(["A5", "A6", "TN", "Letter"]),
  conceptTitle: z.string().min(1),

  layout: z.object({
    gutterSide: z.enum(["left", "right"]).optional(),
    marginMm: z.number().min(0).max(25),
    gutterMm: z.number().min(0).max(25),
    zones: z.array(ZoneSchema).min(3)
  }),

  layerRecipe: z.array(LayerStepSchema).min(8).max(14),

  tapePlan: z.object({
    transparentTape: z.array(TapeUseSchema).min(1),
    washiTape: z.array(TapeUseSchema).min(1)
  }),

  materials: z.array(z.string()).min(6),

  captions: z
    .array(
      z.object({
        for: z.string().min(1),
        options: z.array(z.string()).length(6)
      })
    )
    .min(1),

  writing: z.object({
    toneGuidance: z.string().min(1),
    prompts: z.array(z.string()).length(3),
    draftParagraph: z.string().min(80).max(900),
    microCaptions: z.array(z.string()).min(6)
  }),

  safetyAndCare: z.array(z.string()).min(3),
  tags: z.array(z.string()).min(2)
});

export const PhysicalSpreadPlanListSchema = z
  .array(PhysicalSpreadPlanSchema)
  .min(1)
  .max(3);

export type PhysicalSpreadPlan = z.infer<typeof PhysicalSpreadPlanSchema>;
