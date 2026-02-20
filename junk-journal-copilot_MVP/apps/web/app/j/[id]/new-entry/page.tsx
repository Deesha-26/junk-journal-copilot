"use client";
import { useState } from "react";
import { apiPost, apiGet } from "../../../lib/api";

export default function NewEntryPage({ params }: { params: { id: string } }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function create() {
    setBusy(true); setErr(null);
    try {
      await apiGet("/api/bootstrap");
      const entry = await apiPost<any>("/api/entries", { journalId: params.id });
      window.location.href = `/e/${entry.id}`;
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add Entry</h1>
        <p className="text-black/60">Create an entry, then upload photos/media. You’ll get page preview options to approve.</p>
      </div>

      <div className="p-6 rounded-2xl border border-black/10 bg-white/40 space-y-4">
        {err && <div className="text-sm text-red-700">{err}</div>}
        <button disabled={busy} onClick={create} className="w-full px-4 py-2.5 rounded-xl bg-black text-white disabled:opacity-60">
          {busy ? "Creating..." : "Create Entry"}
        </button>
      </div>
    </div>
  );
}
