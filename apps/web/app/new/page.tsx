"use client";
import { useState } from "react";
import { apiGet, apiPost } from "../lib/api";

const PAGE_SIZES = ["A5", "A4", "US Letter", "8x8", "12x12"];
const THEMES = ["scrapbook", "vintage", "minimal", "travel", "cozy", "floral"];

export default function NewJournalPage() {
  const [title, setTitle] = useState("My Junk Journal");
  const [pageSize, setPageSize] = useState("A5");
  const [themeFamily, setThemeFamily] = useState("scrapbook");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setErr(null);
    try {
      await apiGet("/api/bootstrap");
      const { journal } = await apiPost<any>("/api/journals", { name: title, pageSize, themeFamily });
window.location.href = `/j/${journal.id}`;    } catch (e: any) {
      setErr(e?.message ?? "Failed to create journal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Journal</h1>
        <p className="text-black/60">Pick a page size and theme.</p>
      </div>

      <div className="p-6 rounded-2xl border border-black/10 bg-white/40 space-y-4">
        <label className="block">
          <div className="text-sm font-medium">Title</div>
          <input
            className="mt-1 w-full px-3 py-2 rounded-xl border border-black/15 bg-white"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <div className="text-sm font-medium">Page size</div>
            <select
              className="mt-1 w-full px-3 py-2 rounded-xl border border-black/15 bg-white"
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value)}
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="text-sm font-medium">Theme</div>
            <select
              className="mt-1 w-full px-3 py-2 rounded-xl border border-black/15 bg-white"
              value={themeFamily}
              onChange={(e) => setThemeFamily(e.target.value)}
            >
              {THEMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>

        {err && <div className="text-sm text-red-700">{err}</div>}

        <button
          disabled={busy}
          onClick={create}
          className="w-full px-4 py-2.5 rounded-xl bg-black text-white disabled:opacity-60"
        >
          {busy ? "Creating..." : "Create Journal"}
        </button>
      </div>
    </div>
  );
}
