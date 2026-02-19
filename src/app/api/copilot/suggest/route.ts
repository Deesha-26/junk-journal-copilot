import { NextResponse } from "next/server";
import { PhysicalSpreadPlanListSchema } from "@/lib/physicalSpreadTypes";

export async function POST(req: Request) {
  const body = await req.json();
  const { spreadMode, pageFormat, gutterSide, title } = body as {
    spreadMode: "single" | "two_page";
    pageFormat: "A5" | "A6" | "TN" | "Letter";
    gutterSide: "left" | "right";
    title?: string;
  };

  const conceptTitle = title?.trim()
    ? `Essence: ${title.trim()}`
    : "Found Things, Soft Day";

  const singlePlan = {
    spreadMode: "single" as const,
    pageFormat,
    conceptTitle,
    layout: {
      gutterSide,
      marginMm: 8,
      gutterMm: 8,
      zones: [
        {
          zoneId: "anchor",
          page: "single",
          placement: "center",
          description: "Main anchor centered; keep gutter clear."
        },
        {
          zoneId: "clusterA",
          page: "single",
          placement: "top-left",
          description:
            "Delicate cluster: leaves/fragile bits, frame-taped with clear tape."
        },
        {
          zoneId: "clusterB",
          page: "single",
          placement: "bottom-right",
          description: "Heavier cluster: coins/tokens; strap or pocket if bulky."
        },
        {
          zoneId: "journalBlock",
          page: "single",
          placement: "bottom",
          description: "Handwriting area with breathing room."
        },
        {
          zoneId: "captionStrip",
          page: "single",
          placement: "top",
          description: "Date + tiny labels."
        }
      ]
    },
    layerRecipe: [
      {
        step: 1,
        page: "single",
        action: "tear",
        target: "background strip",
        method: "Tear a thin kraft/tissue strip behind the anchor edge.",
        rationale: "Softens edges and adds texture."
      },
      {
        step: 2,
        page: "single",
        action: "place",
        target: "scrap #1 (anchor)",
        method: "Center it; respect margin and gutter.",
        rationale: "Sets the visual weight."
      },
      {
        step: 3,
        page: "single",
        action: "tape",
        target: "scrap #1 edges",
        method: "Clear hinge tape: 2–3 short strips on corners/edges.",
        rationale: "Secure without hiding."
      },
      {
        step: 4,
        page: "single",
        action: "place",
        target: "scrap #2 (delicate)",
        method: "Angle top-left; float over anchor slightly.",
        rationale: "Adds motion; feels found."
      },
      {
        step: 5,
        page: "single",
        action: "tape",
        target: "scrap #2 (delicate)",
        method: "Frame tape perimeter with thin clear strips; avoid the center.",
        rationale: "Prevents curling and preserves texture."
      },
      {
        step: 6,
        page: "single",
        action: "place",
        target: "scrap #3 (paper/receipt)",
        method: "Tuck a corner under anchor; peek into journal area.",
        rationale: "Adds paper-trail authenticity."
      },
      {
        step: 7,
        page: "single",
        action: "tape",
        target: "scrap #3 corner",
        method: "One washi tab + one clear hinge.",
        rationale: "Charm + stability."
      },
      {
        step: 8,
        page: "single",
        action: "pocket_build",
        target: "optional pocket (bulky)",
        method: "Fold scrap paper pocket; glue seams; reinforce with clear tape.",
        rationale: "Stops page bulge from fighting the binding."
      },
      {
        step: 9,
        page: "single",
        action: "label",
        target: "caption strip",
        method: "Add 2–3 micro labels (date + 2 words).",
        rationale: "Breadcrumbs make it curated."
      },
      {
        step: 10,
        page: "single",
        action: "write",
        target: "journal block",
        method: "Write 6–10 short lines; leave whitespace.",
        rationale: "Collage + reflection, not a wall-of-text."
      }
    ],
    tapePlan: {
      transparentTape: [
        {
          useFor: "leaf/delicate edges",
          technique: "frame tape",
          notes: "Perimeter only; don’t seal moisture inside."
        },
        {
          useFor: "anchor corners",
          technique: "hinge tape",
          notes: "Short hinges reduce glare and keep it tidy."
        },
        {
          useFor: "bulky item stabilization",
          technique: "strap tape / pocket",
          notes: "Strap if removable; pocket if heavy."
        }
      ],
      washiTape: [
        {
          useFor: "receipt tab",
          technique: "corner tab",
          notes: "One tab per cluster is enough—avoid overpowering."
        },
        {
          useFor: "date header",
          technique: "mini banner",
          notes: "Thin banner unifies without clutter."
        }
      ]
    },
    materials: [
      "transparent tape (clear)",
      "washi tape (1–2 patterns)",
      "glue stick (optional for flat paper)",
      "glue dots (optional for chunky items)",
      "fine-liner pen",
      "label stickers / scrap paper for captions"
    ],
    captions: [
      {
        for: "scrap cluster",
        options: [
          "tiny proof",
          "kept anyway",
          "soft day",
          "found + saved",
          "small relics",
          "quiet details"
        ]
      }
    ],
    writing: {
      toneGuidance: "Warm, sensory, imperfect. Pin down texture, not a report.",
      prompts: [
        "What did you notice that most people miss?",
        "What did you keep, and why?",
        "What felt small but meaningful today?"
      ],
      draftParagraph:
        "Today felt like a pocketful of small proofs—paper trails, tiny textures, a few seconds I didn’t want to lose. I’m not trying to tell the whole story—just enough to return to the feeling later. The scraps aren’t perfect, but they’re honest. They say: I was here. I noticed. And that was enough.",
      microCaptions: ["found", "kept", "soft", "tiny proof", "still here", "details"]
    },
    safetyAndCare: [
      "Delicate items (leaves): tape the perimeter to reduce curling; avoid trapping moisture.",
      "Bulky items (coins/tokens): use a pocket or strap to reduce binding stress and page bulge.",
      "Write after taping so you don’t smear ink on glossy tape or drag tape edges."
    ],
    tags: ["junk-journal", "transparent-tape", "found-objects"]
  };

  const twoPagePlan = {
    ...singlePlan,
    spreadMode: "two_page" as const,
    layout: {
      marginMm: 8,
      gutterMm: 12,
      zones: [
        {
          zoneId: "anchor",
          page: "left",
          placement: "center",
          description: "Left page collage base; keep center gutter clear."
        },
        {
          zoneId: "clusterA",
          page: "left",
          placement: "top-left",
          description: "Delicate cluster on outer edge (frame-taped)."
        },
        {
          zoneId: "pocket",
          page: "left",
          placement: "bottom-left",
          description: "Pocket for bulky items; avoid center gutter."
        },
        {
          zoneId: "journalBlock",
          page: "right",
          placement: "center",
          description: "Right page is writing-heavy, clean space for handwriting."
        },
        {
          zoneId: "captionStrip",
          page: "right",
          placement: "top",
          description: "Date + tiny labels on right page header."
        }
      ]
    },
    layerRecipe: singlePlan.layerRecipe.map((s) => ({
      ...s,
      page: s.action === "write" ? "right" : "left"
    })),
    tapePlan: {
      ...singlePlan.tapePlan,
      transparentTape: [
        ...singlePlan.tapePlan.transparentTape,
        {
          useFor: "cross-page continuity",
          technique: "floating edge tabs",
          notes: "Don’t bridge the gutter with bulky tape; keep it light."
        }
      ]
    }
  };

  const plans = spreadMode === "two_page" ? [twoPagePlan] : [singlePlan];
  const parsed = PhysicalSpreadPlanListSchema.safeParse(plans);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid plan schema", details: parsed.error.flatten() },
      { status: 500 }
    );
  }

  return NextResponse.json(parsed.data);
}
