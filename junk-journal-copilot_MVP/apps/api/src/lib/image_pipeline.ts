import sharp from "sharp";
import path from "path";
import { ensureDir, derivedDir } from "./storage.js";

/**
 * MVP image pipeline:
 * - rotate per EXIF
 * - resize to max dimension
 * - trim borders (helps for object-on-plain backgrounds)
 * - mild enhance (modulate + sharpen)
 */
export async function createDerivedImage(opts: {
  ownerId: string;
  entryId: string;
  inputPath: string;
  outputName: string;
  maxDim?: number;
  trim?: boolean;
  enhanceStrength?: "low" | "medium" | "high";
}): Promise<{ derivedPath: string; derivedRelUrl: string }> {
  const outDir = derivedDir(opts.ownerId, opts.entryId);
  ensureDir(outDir);

  const maxDim = opts.maxDim ?? 1800;
  const strength = opts.enhanceStrength ?? "medium";

  const modulate =
    strength === "low"
      ? { saturation: 1.05, brightness: 1.02 }
      : strength === "high"
      ? { saturation: 1.2, brightness: 1.05 }
      : { saturation: 1.12, brightness: 1.03 };

  let p = sharp(opts.inputPath)
    .rotate()
    .resize({ width: maxDim, height: maxDim, fit: "inside", withoutEnlargement: true });

  if (opts.trim) p = p.trim(12);

  p = p.modulate(modulate).sharpen(strength === "high" ? 1.2 : strength === "low" ? 0.6 : 0.9);

  const outPath = path.join(outDir, opts.outputName);
  await p.jpeg({ quality: 90 }).toFile(outPath);

  const derivedRelUrl = `/${opts.ownerId}/${opts.entryId}/_derived/${opts.outputName}`;
  return { derivedPath: outPath, derivedRelUrl };
}
