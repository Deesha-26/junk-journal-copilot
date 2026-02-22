"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, apiUpload } from "../../lib/api";

/** Matches REAL backend response from /api/entries/:id/preview */
type PreviewPayload = {
  entry: {
    id: string;
    journalId: string;
    createdAt: string;
    updatedAt: string;
    status: "draft" | "approved";
    title: string;
    description: string;
    template: string;
    mediaIds: string[];
  };
  media: {
    id: string;
    originalName: string;
    thumbUrl: string;
    beautifiedUrl: string;
    originalUrl: string;
  }[];
  preview: {
    createdAt: string;
    options: {
      id: string;
      style: "scrapbook" | "vintage" | "minimal";
      label: string;
      layout: any;
      suggestion: { title: string; description: string };
    }[];
  };
};

export default function EntryPage({ params }: { params: { id: string } }) {
  const entryId = params.id;

  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [chosen, setChosen] = useState<string>("opt_scrapbook");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [err, setErr] = useState<string | null>(null);

  /** Load preview from API */
  async function loadPreview() {
    const p = await apiPost<PreviewPayload>(`/api/entries/${entryId}/preview`, {});
    setPreview(p);

    const firstOpt = p.preview?.options?.[0];
    setChosen(firstOpt?.id ?? "opt_scrapbook");
    setTitle(firstOpt?.suggestion?.title ?? "");
    setDesc(firstOpt?.suggestion?.description ?? "");
  }

  /** Bootstrap cookie + load preview */
  useEffect(() => {
    apiGet("/api/bootstrap")
      .then(loadPreview)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId]);

  /** Upload images */
  async function doUpload() {
    if (!files.length) return;
    setUploading(true);
    setErr(null);

    try {
      await apiUpload(`/api/entries/${entryId}/media`, files);
      await loadPreview();
      setFiles([]);
    } catch (e: any) {
      setErr(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  /** Approve entry */
  async function approve() {
    setErr(null);
    try {
      await apiPost(`/api/entries/${entryId}/approve`, {
        template: chosen,
        title,
        description: desc,
      });
      alert("Approved! Now this entry will appear in Book View.");
    } catch (e: any) {
      setErr(e?.message ?? "Approve failed");
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
          <p className="text-black/60">Upload → preview → approve.</p>
        </div>
        <a
          href="javascript:history.back()"
          className="text-sm px-3 py-2 rounded-xl border border-black/15 bg-white/40"
        >
          Back
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT PANEL */}
        <div className="lg:col-span-4 p-5 rounded-2xl border border-black/10 bg-white/40 space-y-4">
          <div className="font-semibold">Upload photos</div>

          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="block w-full text-sm"
          />

          <button
            disabled={uploading || files.length === 0}
            onClick={doUpload}
            className="w-full px-4 py-2.5 rounded-xl bg-black text-white disabled:opacity-60"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>

          {err && <div className="text-sm text-red-700">{err}</div>}

          {/* Suggested text */}
          <div className="pt-2 border-t border-black/10">
            <div className="font-semibold">Suggested text</div>

            <label className="block mt-2 text-sm">
              Title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-black/15 bg-white"
              />
            </label>

            <label className="block mt-3 text-sm">
              Description
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={4}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-black/15 bg-white"
              />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            <button
              onClick={regenerate}
              className="px-3 py-2 rounded-xl border border-black/15 bg-white/40"
            >
              Regenerate
            </button>
            <button
              onClick={() =>
                alert("Edit = change Title/Description for MVP. Layout edits come later.")
              }
              className="px-3 py-2 rounded-xl border border-black/15 bg-white/40"
            >
              Edit
            </button>
            <button onClick={approve} className="px-3 py-2 rounded-xl bg-black text-white">
              Approve
            </button>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="lg:col-span-8 space-y-4">
          {/* Preview options */}
          <div className="p-5 rounded-2xl border border-black/10 bg-white/40">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Preview options</div>
              <div className="text-sm text-black/60">Pick one</div>
            </div>

            {!preview || (preview.preview?.options?.length ?? 0) === 0 ? (
              <div className="mt-4 text-black/60">Upload photos to generate previews.</div>
            ) : (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {preview.preview.options.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setChosen(o.id)}
                    className={[
                      "text-left p-3 rounded-2xl border bg-white/60",
                      chosen === o.id ? "border-black/40" : "border-black/10",
                    ].join(" ")}
                  >
                    <div className="text-sm font-medium">{o.label}</div>
                    <div className="mt-2 text-xs text-black/60">Template ID: {o.id}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Media preview */}
          <div className="p-5 rounded-2xl border border-black/10 bg-white/40">
            <div className="font-semibold">Media suggestions</div>
            <div className="text-sm text-black/60">Thumbnail vs Beautified</div>

            {!preview || (preview.media?.length ?? 0) === 0 ? (
              <div className="mt-3 text-black/60">No media yet.</div>
            ) : (
              <div className="mt-4 space-y-4">
                {preview.media.map((m) => (
                  <div key={m.id} className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-black/60">Thumbnail</div>
                      <img
                        src={m.thumbUrl}
                        alt="thumb"
                        className="mt-1 rounded-xl border border-black/10 w-full"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-black/60">Beautified</div>
                      <img
                        src={m.beautifiedUrl}
                        alt="beautified"
                        className="mt-1 rounded-xl border border-black/10 w-full"
                      />
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