# Junk Journal Copilot — MVP (Beta-ready core)

This is a working end-to-end MVP:
- Library → Journals → Entries
- Upload media (photos)
- Preview bundle (deterministic templates + server-side image enhancement)
- Approve / Regenerate flow (approve persists an EntryVersion)
- Book view (flipbook) for approved entries
- Share links (public / invite) for approved entries only
- No auth UI, but **user data isolation** via anonymous cookie (`jj_token`) set by the API

## Stack
- Web: Next.js 14 (App Router) + Tailwind + react-pageflip
- API: Express + TypeScript + Prisma + Postgres
- Image: Sharp (rotate/resize/enhance/trim)
- Storage: local filesystem under `apps/api/storage/`

## Run locally
Prereqs: Node 20+, Docker

```bash
npm install
docker compose up -d

cd apps/api
cp .env.example .env
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

New terminal:
```bash
cd apps/web
npm run dev
```

Open http://localhost:3000
