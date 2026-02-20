"use client";

import { useEffect, useState } from "react";
import { apiGet, apiUpload, apiPost } from "../../lib/api";
import type { PreviewBundle } from "@jj/shared";

export default function EntryPage({ params }: { params: { id: string } }) {
  const entryId = params.id;
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<PreviewBundle | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function loadPreview() {
    const p = await apiGet<PreviewBundle>(`/api/preview/${entryId}`);
    setPreview(p);
    setChosen(p.pageOptions[0]?.id ?? null);
    setTitle(p.suggestedTitle ?? "");
    setDesc(p.suggestedDescription ?? "");
  }

  useEffect(() => {
    apiGet("/api/bootstrap").then(loadPreview).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId]);

  async function doUpload() {
    if (!files.length) return;
    setUploading(true); setErr(null);
    try {
      await apiUpload(`/api/upload/${entryId}`, files);
      await loadPreview();
      setFiles([]);
    } catch (e: any) {
      setErr(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function approve() {
    if (!chosen) return;
    setErr(null);
    try {
      await apiPost(`/api/approve/${entryId}`, { chosenOptionId: chosen, titleFinal: title, descFinal: desc, decisions: {} });
      alert("Approved! Saved as part of the journal.");
    } catch (e: any) {
      setErr(e.message ?? "Approve failed");
    }
  }

  async function regenerate() {
    await loadPreview();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Entry</h1>
          <p className="text-black/60">Upload → preview options → approve to save pages.</p>
        </div>
        <a href="javascript:history.back()" className="text-sm px-3 py-2 rounded-xl border border-black/15 bg-white/40">Back</a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4 p-5 rounded-2xl border border-black/10 bg-white/40 space-y-4">
          <div className="font-semibold">Upload photos</div>
          <input type="file" multiple accept="image/*"
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="block w-full text-sm" />

          <button disabled={uploading || files.length === 0} onClick={doUpload}
            className="w-full px-4 py-2.5 rounded-xl bg-black text-white disabled:opacity-60">
            {uploading ? "Uploading..." : "Upload"}
          </button>

          {err && <div className="text-sm text-red-700">{err}</div>}

          <div className="pt-2 border-t border-black/10">
            <div className="font-semibold">Suggested text</div>
            <label className="block mt-2 text-sm">
              Title
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-black/15 bg-white" />
            </label>
            <label className="block mt-3 text-sm">
              Description
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={4}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-black/15 bg-white" />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button onClick={regenerate} className="px-4 py-2 rounded-xl border border-black/15 bg-white/40">Regenerate</button>
            <button onClick={approve} disabled={!chosen} className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-60">Approve</button>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          <div className="p-5 rounded-2xl border border-black/10 bg-white/40">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Page preview options</div>
              <div className="text-sm text-black/60">Pick a layout, then approve.</div>
            </div>

            {!preview || preview.pageOptions.length === 0 ? (
              <div className="mt-4 text-black/60">Upload some photos to generate previews.</div>
            ) : (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {preview.pageOptions.map((o) => (
                  <button key={o.id} onClick={() => setChosen(o.id)}
                    className={`text-left p-3 rounded-2xl border ${chosen === o.id ? "border-black/40" : "border-black/10"} bg-white/60`}>
                    <div className="text-sm font-medium">{o.name}</div>
                    <img alt={o.name} src={o.previewImageUrl} className="mt-2 rounded-xl border border-black/10 w-full" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 rounded-2xl border border-black/10 bg-white/40">
            <div className="font-semibold">Media suggestions</div>
            <div className="text-sm text-black/60">Enhanced images are generated server-side via Sharp.</div>

            {!preview || preview.mediaSuggestions.length === 0 ? (
              <div className="mt-3 text-black/60">No media yet.</div>
            ) : (
              <div className="mt-4 space-y-4">
                {preview.mediaSuggestions.map((m) => (
                  <div key={m.mediaAssetId} className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-black/60">Before</div>
                      <img src={m.beforeUrl} alt="before" className="mt-1 rounded-xl border border-black/10 w-full" />
                    </div>
                    <div>
                      <div className="text-xs text-black/60">After</div>
                      <img src={m.afterUrl} alt="after" className="mt-1 rounded-xl border border-black/10 w-full" />
                    </div>
                    <div className="col-span-2 text-xs text-black/60">
                      Suggested edits: {m.suggestedEdits.map((e) => e.type).join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
