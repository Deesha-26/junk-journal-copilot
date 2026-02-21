// apps/web/app/j/[id]/page.tsx
import Link from "next/link";

export default function JournalHomePage({
  params,
}: {
  params: { id: string };
}) {
  const journalId = params.id;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold">Junk Journal</h1>
          <p className="text-white/60 mt-2">Journal ID: {journalId}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href={`/j/${journalId}/book`}
            className="rounded-xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition"
          >
            <div className="text-xl font-semibold">Open Flipbook</div>
            <div className="text-white/60 text-sm mt-2">
              View this journal as a page-flip book.
            </div>
          </Link>

          <Link
            href={`/j/${journalId}/new-entry`}
            className="rounded-xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition"
          >
            <div className="text-xl font-semibold">Add New Entry</div>
            <div className="text-white/60 text-sm mt-2">
              Upload photos / memories and let AI generate pages.
            </div>
          </Link>
        </div>

        <div className="mt-10 rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="text-lg font-semibold mb-2">Next</div>
          <ul className="list-disc pl-5 text-white/70 text-sm space-y-1">
            <li>Confirm your API base URL env var is set in Vercel.</li>
            <li>Wire this page to fetch journal metadata (title, cover, count).</li>
            <li>Make /book fetch real pages instead of demo pages.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}