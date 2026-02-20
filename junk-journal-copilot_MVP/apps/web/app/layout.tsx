import "./globals.css";

export const metadata = {
  title: "Junk Journal Copilot",
  description: "AI-assisted junk journal builder (MVP)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="px-6 py-4 border-b border-black/10 bg-white/40 backdrop-blur">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              <a href="/" className="font-semibold tracking-tight">Junk Journal Copilot</a>
              <div className="flex gap-2">
                <a href="/new" className="text-sm px-3 py-1.5 rounded-full border border-black/15 hover:border-black/30">New Journal</a>
                <a href="/shared" className="text-sm px-3 py-1.5 rounded-full border border-black/15 hover:border-black/30">Shared</a>
              </div>
            </div>
          </header>
          <main className="px-6 py-6">
            <div className="max-w-5xl mx-auto">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
