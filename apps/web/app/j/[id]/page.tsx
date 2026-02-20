import { apiGet } from "../../lib/api";

type EntryListItem = {
  id: string;
  createdAt: string;
  status: string;
  titleFinal?: string | null;
  descFinal?: string | null;
  mediaCount: number;
  currentVersion: any | null;
};

type Journal = { id: string; title: string; themeFamily: string; pageSize: string; };

export default async function JournalPage({ params }: { params: { id: string } }) {
  await apiGet("/api/bootstrap");
  const journals = await apiGet<Journal[]>("/api/journals");
  const journal = journals.find(j => j.id === params.id);
  const entries = await apiGet<EntryListItem[]>(`/api/entries/by-journal/${params.id}`);

  if (!journal) return <div className="p-6 rounded-2xl border border-black/10 bg-white/40">Journal not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{journal.title}</h1>
          <p className="text-black/60">{journal.themeFamily} • {journal.pageSize}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <a href={`/j/${params.id}/new-entry`} className="text-sm px-3 py-2 rounded-xl bg-black text-white">Add Entry</a>
          <a href={`/j/${params.id}/book`} className="text-sm px-3 py-2 rounded-xl border border-black/15 bg-white/40">View as Book</a>
          <a href={`/j/${params.id}/share`} className="text-sm px-3 py-2 rounded-xl border border-black/15 bg-white/40">Share</a>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="p-10 rounded-2xl border border-black/10 bg-white/40">
          <p className="font-medium">No entries yet.</p>
          <p className="text-black/60 mt-1">Add an entry and upload photos to generate page previews.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(e => (
            <a key={e.id} href={`/e/${e.id}`} className="block p-5 rounded-2xl border border-black/10 bg-white/40 hover:border-black/20">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{e.titleFinal ?? "Untitled entry"}</div>
                  <div className="text-sm text-black/60">{new Date(e.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-xs px-2 py-1 rounded-full border border-black/15">{e.status} • {e.mediaCount} media</div>
              </div>
              {e.descFinal && <p className="text-sm text-black/70 mt-2 line-clamp-2">{e.descFinal}</p>}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
