import { apiGet } from "../../../../lib/api";

export default async function PublicSharePage({ params }: { params: { slug: string } }) {
  const data = await apiGet<any>(`/api/share/public/${params.slug}`);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl border border-black/10 bg-white/40">
        <div className="text-sm text-black/60">Shared Journal</div>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">{data.journal.title}</h1>
        <p className="text-black/60">{data.journal.themeFamily} • {data.journal.pageSize}</p>
      </div>

      <div className="space-y-3">
        {data.entries.map((e: any, idx: number) => (
          <div key={e.id} className="p-5 rounded-2xl border border-black/10 bg-white/40">
            <div className="text-sm text-black/60">Page {idx + 1}</div>
            <div className="text-lg font-semibold">{e.title ?? "Untitled"}</div>
            {e.desc && <p className="text-black/70 mt-2">{e.desc}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
