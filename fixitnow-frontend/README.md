# FixItNow — Frontend

Modern Next.js 14 frontend for the FixItNow home-services marketplace.

## Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn-style UI primitives
- TanStack Query + Axios for API
- Zustand for auth state (persisted)
- React Hook Form + Zod for forms
- Framer Motion for animations
- Three.js (LightRays — React Bits style hero background)
- lucide-react icons

## Setup

```bash
cd fixitnow-frontend
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_BASE
npm run dev
```

The dev server runs on http://localhost:3000.

## Environment

- `NEXT_PUBLIC_API_BASE` — backend base URL (default `https://fixlit-now.vercel.app/api`)

## Folder Structure

```
src/
  app/                # Routes (App Router)
    (public)/         # Public pages
    (auth)/           # Login / Register
  components/
    ui/               # shadcn-style primitives
    public/           # Public-only components (navbar, footer)
    light-rays.tsx    # React Bits–style WebGL background
  hooks/              # Zustand stores & custom hooks
  lib/                # api, utils, helpers
  services/           # API service functions
  types/              # Shared TypeScript types
```

## Backend

This app talks to https://fixlit-now.vercel.app. See the sibling `FixltNow-Backend/` folder for the API.
