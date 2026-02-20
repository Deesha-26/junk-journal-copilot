export type PageSize = "A5" | "A4" | "LETTER" | "8x8" | "12x12";
export type ThemeFamily = "scrapbook" | "vintage" | "minimal" | "travel" | "cozy" | "floral";
export type EntryStatus = "draft" | "approved";

export type SuggestedEdit =
  | { type: "crop_rect"; x: number; y: number; w: number; h: number }
  | { type: "mask_object"; mode: "tight" | "medium" | "loose" }
  | { type: "enhance"; strength: "low" | "medium" | "high" }
  | { type: "perspective_fix" };

export type MediaSuggestion = {
  mediaAssetId: string;
  kind: "page_photo" | "object" | "unknown" | string;
  beforeUrl: string;
  afterUrl: string;
  suggestedEdits: SuggestedEdit[];
};

export type PreviewOption = {
  id: string;
  name: string;
  previewImageUrl: string; // data URL (SVG) in MVP
};

export type PreviewBundle = {
  entryId: string;
  suggestedTitle: string;
  suggestedDescription: string;
  mediaSuggestions: MediaSuggestion[];
  pageOptions: PreviewOption[];
};
