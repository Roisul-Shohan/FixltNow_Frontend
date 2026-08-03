# FixItNow — Frontend

Modern Next.js 15 frontend for the FixItNow home-services marketplace. It
talks to the deployed FixltNow backend at `https://fixlit-now.vercel.app/api`
by default — no env config needed for production.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn-style UI primitives
- TanStack Query + Axios for API
- Zustand for auth state (persisted)
- React Hook Form + Zod for forms
- Framer Motion for animations
- Three.js (LightRays — React Bits style hero background)
- lucide-react icons

## Backend

This app talks to the FixltNow Express API.

- **Production (default):** `https://fixlit-now.vercel.app/api`
- **Source:** [github.com/Roisul-Shohan/FixltNow](https://github.com/Roisul-Shohan/FixltNow)
- **Live API docs:** [Postman](https://documenter.getpostman.com/view/49986455/2sBY4LRhJm)

The base URL is hard-coded as a fallback in `src/lib/api.ts`; override it by
setting `NEXT_PUBLIC_API_BASE` in `.env.local` (for local dev) or in Vercel's
**Project → Settings → Environment Variables** (for preview/production).

## Setup

```bash
cd fixitnow-frontend
npm install
cp .env.local.example .env.local   # already points at the deployed backend
npm run dev
```

The dev server runs on http://localhost:3000.

To point at a local backend instead, edit `.env.local`:

```env
NEXT_PUBLIC_API_BASE=http://localhost:5000/api
```

## Environment

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_BASE` | no | `https://fixlit-now.vercel.app/api` | Backend API base URL (must include `/api`). Inlined at build time. |

## Folder Structure

```
src/
  app/                # Routes (App Router)
    (public)/         # Public pages (customer + tech + admin)
    payment/          # Stripe success/cancel landing pages
  components/
    ui/               # shadcn-style primitives
    public/           # Public-only components (navbar, footer)
    customer/         # Customer dashboard sidebar & widgets
    tech/             # Technician dashboard sidebar & widgets
    admin/            # Admin dashboard sidebar & widgets
    services/         # Cross-feature components
    technicians/      # Technician browsing components
    light-rays.tsx    # React Bits–style WebGL background
  hooks/              # Zustand stores & custom hooks
  lib/                # api, utils, helpers
  services/           # API service functions
  types/              # Shared TypeScript types
```

## Deployment (Vercel)

The repo ships with a `vercel.json` declaring the Next.js framework so the
Vercel CLI can deploy with zero prompts.

### One-time login

```bash
npm i -g vercel
vercel login
```

### First deploy (creates the Vercel project + link)

From the `fixitnow-frontend/` folder:

```bash
vercel
```

Vercel will detect `vercel.json` and use `next build` automatically. When
prompted:

- **Set up and deploy?** `Y`
- **Which scope?** your personal/team account
- **Link to existing project?** `N` (first time) → pick a name, e.g.
  `fixitnow-frontend`
- **Override settings?** `N` — `vercel.json` already declares framework,
  build command, install command, and output directory.

### Production deploy

```bash
vercel --prod
```

### Required environment variables

Set in Vercel → **Project → Settings → Environment Variables** (or via
`vercel env add`):

| Key | Value | Environments |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE` | `https://fixlit-now.vercel.app/api` | Production, Preview |

> `NEXT_PUBLIC_*` vars are inlined at build time, so a deploy is required
> after changing them.

### Pulling env values locally

```bash
vercel env pull .env.local
```

### Confirming a deployment

```bash
vercel ls
vercel inspect <deployment-url>
```

The CLI will print a `https://fixitnow-frontend-*.vercel.app` URL on success.
