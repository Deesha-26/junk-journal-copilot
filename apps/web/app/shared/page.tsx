"use client";
import { useState } from "react";

export default function SharedLanding() {
  const [link, setLink] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function open() {
    setErr(null);
    try {
      const url = new URL(link);
      window.location.href = url.toString();
    } catch {
      setErr("Please paste a full share URL (public or invite).");
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Open Shared Journal</h1>
        <p className="text-black/60">Paste a share link (public or invite) to open it.</p>
      </div>

      <div className="p-6 rounded-2xl border border-black/10 bg-white/40 space-y-3">
        <input value={link} onChange={(e)=>setLink(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-black/15 bg-white" placeholder="https://..." />
        {err && <div className="text-sm text-red-700">{err}</div>}
        <button onClick={open} className="w-full px-4 py-2.5 rounded-xl bg-black text-white">Open</button>
      </div>
    </div>
  );
}
