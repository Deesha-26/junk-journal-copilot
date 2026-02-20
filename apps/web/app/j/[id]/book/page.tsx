"use client";

import { useEffect, useMemo, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import { apiGet } from "../../../lib/api";

type EntryListItem = { id: string; status: string; titleFinal?: string | null; descFinal?: string | null; };

export default function BookPage({ params }: { params: { id: string } }) {
  const [entries, setEntries] = useState<EntryListItem[]>([]);

  useEffect(() => {
    apiGet("/api/bootstrap").then(async () => {
      const e = await apiGet<EntryListItem[]>(`/api/entries/by-journal/${params.id}`);
      setEntries(e.filter((x) => x.status === "approved"));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const pages = useMemo(() => entries.map((e, idx) => ({ idx: idx + 1, title: e.titleFinal ?? "Untitled", desc: e.descFinal ?? "" })), [entries]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Book View</h1>
          <p className="text-black/60">Flipbook preview (MVP uses text pages; next step is real rendered pages).</p>
        </div>
        <a href={`/j/${params.id}`} className="text-sm px-3 py-2 rounded-xl border border-black/15 bg-white/40">Back</a>
      </div>

      {pages.length === 0 ? (
        <div className="p-10 rounded-2xl border border-black/10 bg-white/40">
          <p className="font-medium">No approved pages yet.</p>
          <p className="text-black/60 mt-1">Approve an entry to add pages to the book.</p>
        </div>
      ) : (
        <div className="flex justify-center">
          <HTMLFlipBook width={360} height={520} showCover={true} className="shadow-2xl">
            <div className="bg-white p-6 border border-black/10">
              <div className="text-sm text-black/60">Cover</div>
              <div className="text-2xl font-semibold mt-2">My Junk Journal</div>
              <div className="text-black/60 mt-2">Flip to read →</div>
            </div>
            {pages.map((p) => (
              <div key={p.idx} className="bg-white p-6 border border-black/10">
                <div className="text-sm text-black/60">Page {p.idx}</div>
                <div className="text-xl font-semibold mt-2">{p.title}</div>
                {p.desc && <p className="text-black/70 mt-3">{p.desc}</p>}
              </div>
            ))}
            <div className="bg-white p-6 border border-black/10">
              <div className="text-sm text-black/60">The End</div>
              <div className="text-black/60 mt-2">Share this journal from the journal page.</div>
            </div>
          </HTMLFlipBook>
        </div>
      )}
    </div>
  );
}
