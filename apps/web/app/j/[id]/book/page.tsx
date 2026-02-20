"use client";
import { useEffect, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import { apiGet } from "../../../lib/api";

type Entry = { id: string; status: string; titleFinal?: string; descFinal?: string };

export default function BookPage({ params }: { params: { id: string } }) {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    (async () => {
      await apiGet("/api/bootstrap");
      const all = await apiGet<Entry[]>(`/api/entries/by-journal/${params.id}`);
      setEntries(all.filter((e) => e.status === "approved"));
    })();
  }, [params.id]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Book View</h1>
          <p className="text-black/60">Flipbook preview for approved entries.</p>
        </div>
        <a href={`/j/${params.id}`} className="text-sm px-3 py-2 rounded-xl border border-black/15 bg-white/40">Back</a>
      </div>

      {entries.length === 0 ? (
        <div className="p-10 rounded-2xl border border-black/10 bg-white/40">
          <p className="font-medium">No approved pages yet.</p>
          <p className="text-black/60 mt-1">Approve an entry to add it to the book.</p>
        </div>
      ) : (
        <div className="flex justify-center">
          <HTMLFlipBook width={360} height={520} showCover={true} className="shadow-2xl">
            <div className="bg-white p-6 border border-black/10">
              <div className="text-sm text-black/60">Cover</div>
              <div className="text-2xl font-semibold mt-2">My Junk Journal</div>
              <div className="text-black/60 mt-2">Flip to read →</div>
            </div>
            {entries.map((e, i) => (
              <div key={e.id} className="bg-white p-6 border border-black/10">
                <div className="text-sm text-black/60">Page {i + 1}</div>
                <div className="text-xl font-semibold mt-2">{e.titleFinal ?? "Untitled"}</div>
                {e.descFinal && <p className="text-black/70 mt-3">{e.descFinal}</p>}
              </div>
            ))}
            <div className="bg-white p-6 border border-black/10">
              <div className="text-sm text-black/60">The End</div>
              <div className="text-black/60 mt-2">Share coming next.</div>
            </div>
          </HTMLFlipBook>
        </div>
      )}
    </div>
  );
}
