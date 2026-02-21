"use client";

import { useEffect, useState } from "react";
import { apiGet } from "./lib/api";

type Journal = { id: string; name: string; createdAt: string };

function safeArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export default function HomePage() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setError(null);

        // If bootstrap fails, we'll show an error instead of crashing.
        await apiGet("/api/bootstrap");

        const data = await apiGet<{ journals?: unknown }>("/api/journals");
        if (cancelled) return;

        setJournals(safeArray<Journal>((data as any)?.journals));
      } catch (e: any) {
        if (cancelled) return;
        setJournals([]);
        setError(e?.message || "Failed to load journals.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div className="p-10 text-black/60">Loading...</div>;

  if (error) {
    return (
      <div className="p-10 rounded-2xl border border-red-200 bg-red-50 text-red-900 space-y-2">
        <div className="font-semibold">Couldn’t load your library</div>
        <div className="text-sm opacity-90">{error}</div>
        <div className="text-sm opacity-90">
          Check that NEXT_PUBLIC_API_URL is set in the Vercel Web project.
        </div>
      </div>
    );
  }

  const items = journals.map((j) => (
    <a
      key={j.id}
      href={`/j/${j.id}`}
      className="group p-5 rounded-2xl border border-black/10 bg-white/40 hover:border-black/20 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">{j.name}</div>
          <div className="text-sm text-black/60">{j.createdAt}</div>
        </div>
        <div className="text-xs text-black/50 group-hover:text-black/70">Open</div>
      </div>
    </a>
  ));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your Library</h1>
        <p className="text-black/60">
          Create journals, add entries, upload photos, preview options, then approve pages.
        </p>
      </div>

      {journals.length === 0 ? (
        <div className="p-10 rounded-2xl border border-black/10 bg-white/40">
          <p className="font-medium">No journals yet.</p>
          <p className="text-black/60 mt-1">Click "New Journal".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{items}</div>
      )}
    </div>
  );
}