import sharp from "sharp";
import path from "path";
import { ensureDir, entryDerivedDir } from "./storage.js";

export async function beautifyImage(opts: {
  ownerId: string;
  entryId: string;
  inputPath: string;
  outputBaseName: string;
  trim?: boolean;
}) {
  const outDir = entryDerivedDir(opts.ownerId, opts.entryId);
  ensureDir(outDir);

  const outName = `${opts.outputBaseName}_enh.jpg`;
  const outPath = path.join(outDir, outName);

  let p = sharp(opts.inputPath)
    .rotate()
    .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true });

  if (opts.trim) p = p.trim(12);

  await p
    .modulate({ saturation: 1.12, brightness: 1.03 })
    .sharpen(0.9)
    .jpeg({ quality: 90 })
    .toFile(outPath);

  return { outName, outPath };
}
