# Eaton Home

The Eaton family home dashboard — a cinematic, glassmorphic web app for tracking
home upgrade projects, budgets, price changes, recurring home care, and a
draggable 3D model of the house with upgrade markers.

Built with **Next.js 16**, **Tailwind CSS 4**, **shadcn/ui**, **GSAP**,
**react-three-fiber**, and **Supabase** (auth + Postgres).

## Features

- **Login** — Supabase email/password auth, plus per-member demo entrances
  (Melanie / Nate) that work without any configuration.
- **Two-person household** — personalized greetings, "updated by" attribution
  on every project, and live sync: either member's changes appear on the
  other's screen within moments (Supabase Realtime).
- **Master priority list** — one ranked list for the whole house with
  drag-and-drop reordering, an exact priority number on create/edit,
  progress, status, and cost.
- **By-category view** — Yard, Outside, Kitchen, Bathrooms, Living Room,
  Office (Mel), Office (Nate), Entry Room, Garage, Master Bedroom, and
  House Repairs.
- **Project pages** — inspiration / before / after photos, store link,
  progress slider, spend tracking, and a shared notes thread with author
  and timestamps.
- **Price tracking** — a full line graph per project (axes, hover tooltips,
  lowest-price marker) and a "best time to buy" signal at the lowest
  tracked price.
- **Items per project** — break a project into the materials it needs, each
  with its own price and buy link, a purchased checklist, and a running total.
- **Budgeting** — project fund, monthly budget, category breakdown, and a
  funding runway that recalculates live.
- **Home care** — recurring tasks (air filters, water filters, gutters…) with
  intervals, due countdowns, and one-tap completion.
- **3D house** — a clean architectural concept model you can drag to orbit,
  with pastel category-icon markers (kitchen, garage, yard…) and status dots
  showing where every upgrade lives.
- **Home facts** — square footage (livable/total), bedrooms, bathrooms, and
  a systems & appliances registry with install years and age-at-a-glance
  chips (amber 10+, orange 15+ years).
- **Change log** — a household activity feed: who added, edited, re-ranked,
  priced, or completed what, grouped by day and filterable by member.
- **Theme palettes** — seven curated color themes (Dusk Teal, Ember,
  Lavender Haze, Rosé, Golden Hour, Juniper, Glacier), saved per member.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:4780 and click **“Step inside the demo home.”**
Demo mode stores data in your browser (localStorage) — no backend needed.

## Connect Supabase (real data + real login)

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/migrations/00000000000001_init.sql`,
   then `supabase/seed.sql` (optional starter data).
   With the Supabase CLI instead: `supabase db push` and
   `psql < supabase/seed.sql`.
3. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. In Supabase → Authentication → Providers, enable **Email**. Create your two
   household accounts (or use the sign-up form on the login page).
5. Restart the dev server. Sign-in now uses Supabase, and all data reads and
   writes go to Postgres (guarded by row-level security for authenticated
   users only).

The seed SQL is generated from the same data demo mode uses:
`node scripts/generate-seed-sql.mjs` regenerates `supabase/seed.sql`.

## Deploy to Vercel

1. Push this repo to GitHub.
2. [Import the repo in Vercel](https://vercel.com/new) — it auto-detects
   Next.js; no build settings needed.
3. Add the two `NEXT_PUBLIC_SUPABASE_*` environment variables in
   Vercel → Project → Settings → Environment Variables.
4. Deploy. Add your Vercel URL to Supabase → Authentication → URL
   Configuration → Site URL so email confirmations redirect correctly.

## Project structure

```
src/
  app/
    login/            # auth screen + demo entrance
    (app)/            # protected app: dashboard, projects, house, tasks, budget
  components/
    house/            # react-three-fiber 3D house scene
    ui/               # shadcn/ui primitives
  lib/
    seed.ts           # demo/seed data (single source of truth)
    data-context.tsx  # data layer: Supabase when configured, localStorage otherwise
    supabase/         # browser/server clients + config
supabase/
  migrations/         # schema + RLS
  seed.sql            # generated starter data
```
