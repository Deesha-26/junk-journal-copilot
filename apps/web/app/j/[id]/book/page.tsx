"use client";

import dynamic from "next/dynamic";
import React, { useMemo } from "react";

// ✅ IMPORTANT: return the *default export component* and hard-cast to any
const HTMLFlipBook = dynamic(
  async () => {
    const mod = await import("react-pageflip");
    return (mod as any).default; // <-- this is the actual React component
  },
  { ssr: false }
) as unknown as React.ComponentType<any>;

type Page = {
  id: string;
  html?: string;
  text?: string;
  imageUrl?: string;
};

// ✅ react-pageflip requires each child page to be a component that forwards a ref
const FlipPage = React.forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(
  function FlipPage({ children, className = "" }, ref) {
    return (
      <div ref={ref} className={`bg-white ${className}`}>
        {children}
      </div>
    );
  }
);

export default function BookPage({ params }: { params: { id: string } }) {
  const journalId = params.id;

  // TODO: replace this with your real fetched data
  const pages: Page[] = useMemo(
    () => [
      { id: "cover", text: "Cover" },
      { id: "p1", text: "Page 1" },
      { id: "p2", text: "Page 2" },
    ],
    []
  );

  const pageElements = useMemo(() => {
    return pages.map((p) => (
      <FlipPage key={p.id} className="p-6">
        <div className="text-xs text-black/50 mb-2">Journal: {journalId}</div>

        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.imageUrl} alt="" className="w-full h-auto rounded" />
        ) : p.html ? (
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: p.html }} />
        ) : (
          <div className="text-base text-black">{p.text ?? ""}</div>
        )}
      </FlipPage>
    ));
  }, [pages, journalId]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Flipbook</h1>
          <p className="text-white/60 text-sm">Journal ID: {journalId}</p>
        </div>

        <div className="flex justify-center">
          <div className="bg-white/5 p-4 rounded-xl">
            <HTMLFlipBook
              width={360}
              height={520}
              size="fixed"
              minWidth={315}
              maxWidth={1000}
              minHeight={400}
              maxHeight={1536}
              maxShadowOpacity={0.2}
              showCover={true}
              mobileScrollSupport={true}
              className=""
            >
              {pageElements}
            </HTMLFlipBook>
          </div>
        </div>
      </div>
    </div>
  );
}