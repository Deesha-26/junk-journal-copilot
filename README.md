# Junk Journal Copilot — Clean MVP

A clean, Codespaces-friendly MVP that avoids config bootstrapping pitfalls.

## MVP capabilities
- Library → Journals → Entries
- Create / delete journals
- Create entries
- Upload photos to an entry
- Server-side "beautify" (rotate/resize/trim + mild enhance) using **sharp**
- Preview: 3 page layout options + suggested title/description
- Approve flow: **Approve / Edit / Regenerate** (Edit is manual via fields)
- Flipbook "Book View" (approved entries)
- Share public link (approved entries only)
- **No auth UI**, but per-user data isolation via anonymous cookie (`jj_token`)

## Tech
- Web: Next.js App Router + Tailwind + react-pageflip
- API: Express + TypeScript + tsx + multer + sharp
- Storage: JSON on disk + files under `apps/api/storage/` (easy to swap to DB later)

## Run (Codespaces)
Open two terminals.

### Terminal 1 (API)
```bash
cd apps/api
cp .env.example .env
npm install
npm run dev
```

### Terminal 2 (Web)
```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

Open port **3000**.

## Notes
- API serves static media at `/storage/...`
- Web uses `NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:3001`).
