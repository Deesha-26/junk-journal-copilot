import { apiGet } from "./lib/api";

type Journal = { id: string; title: string; themeFamily: string; pageSize: string; updatedAt: string; };

export default async function HomePage() {
  await apiGet("/api/bootstrap");
  const journals = await apiGet<Journal[]>("/api/journals");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your Library</h1>
        <p className="text-black/60">Create journals, add entries, preview layouts, then approve to save pages.</p>
      </div>

      {journals.length === 0 ? (
        <div className="p-10 rounded-2xl border border-black/10 bg-white/40">
          <p className="font-medium">No journals yet.</p>
          <p className="text-black/60 mt-1">Click “New Journal” to create your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {journals.map((j) => (
            <a key={j.id} href={`/j/${j.id}`} className="group p-5 rounded-2xl border border-black/10 bg-white/40 hover:border-black/20 transition">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">{j.title}</div>
                  <div className="text-sm text-black/60">{j.themeFamily} • {j.pageSize}</div>
                </div>
                <div className="text-xs text-black/50 group-hover:text-black/70">Open →</div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
