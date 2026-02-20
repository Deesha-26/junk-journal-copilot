"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../../../lib/api";

type Share = { id: string; slug: string; mode: string; };

export default function SharePage({ params }: { params: { id: string } }) {
  const [publicShare, setPublicShare] = useState<Share | null>(null);
  const [inviteShare, setInviteShare] = useState<Share | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  useEffect(() => { apiGet("/api/bootstrap").catch(()=>{}); }, []);

  async function create(mode: "public" | "invite") {
    const out = await apiPost<any>("/api/share", { journalId: params.id, mode });
    if (mode === "public") setPublicShare(out.share);
    else setInviteShare(out.share);
  }

  async function createInvite() {
    if (!inviteShare) return;
    const out = await apiPost<any>("/api/share/invite", { shareId: inviteShare.id });
    setInviteLink(`${window.location.origin}/s/invite/${out.invite.inviteSlug}`);
  }

  const base = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Share Journal</h1>
          <p className="text-black/60">Create public or invite-only links (approved pages only).</p>
        </div>
        <a href={`/j/${params.id}`} className="text-sm px-3 py-2 rounded-xl border border-black/15 bg-white/40">Back</a>
      </div>

      <div className="p-6 rounded-2xl border border-black/10 bg-white/40 space-y-3">
        <div className="font-semibold">Public link</div>
        <div className="text-sm text-black/60">Anyone with the link can view approved pages.</div>
        <button onClick={() => create("public")} className="px-4 py-2 rounded-xl bg-black text-white">Create Public Link</button>
        {publicShare && (
          <div className="mt-2 text-sm">
            <div className="text-black/60">Link:</div>
            <code className="block mt-1 p-3 rounded-xl bg-black/5 break-all">{`${base}/s/public/${publicShare.slug}`}</code>
          </div>
        )}
      </div>

      <div className="p-6 rounded-2xl border border-black/10 bg-white/40 space-y-3">
        <div className="font-semibold">Invite link</div>
        <div className="text-sm text-black/60">Creates a share container, then generate invite links under it.</div>
        <button onClick={() => create("invite")} className="px-4 py-2 rounded-xl border border-black/15 bg-white/60">Create Invite Container</button>
        {inviteShare && (
          <div className="space-y-2">
            <div className="text-sm text-black/60">Invite container created. Now generate an invite link:</div>
            <button onClick={createInvite} className="px-4 py-2 rounded-xl bg-black text-white">Generate Invite Link</button>
            {inviteLink && <code className="block p-3 rounded-xl bg-black/5 break-all">{inviteLink}</code>}
          </div>
        )}
      </div>
    </div>
  );
}
