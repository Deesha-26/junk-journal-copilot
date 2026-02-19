import type { Scrap } from "./db";

export function summarizeScrapsForPrompt(scraps: Scrap[]) {
  const lines: string[] = [];
  let n = 0;

  for (const s of scraps) {
    n += 1;
    if (s.type === "text") {
      lines.push(
        `scrap #${n}: paper/text, label="${(s.text ?? "").slice(0, 140)}"`
      );
    } else if (s.type === "link") {
      lines.push(
        `scrap #${n}: paper/link, url="${s.url ?? ""}", note="${(
          s.text ?? ""
        ).slice(0, 140)}"`
      );
    }
  }

  return lines.length ? lines.join("\n") : "scrap #1: (no scraps yet)";
}
