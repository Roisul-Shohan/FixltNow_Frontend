<div align="center">

# FixItNow — Frontend

**A modern home-services marketplace where customers book verified technicians in minutes.**

Built with Next.js 15, TypeScript, Tailwind CSS, TanStack Query, and Stripe.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-fixlit.vercel.app-6366f1?style=for-the-badge&logo=vercel&logoColor=white)](https://fixlit.vercel.app)
[![Backend API](https://img.shields.io/badge/Backend%20API-fixlit--now.vercel.app-22c55e?style=for-the-badge&logo=fastify&logoColor=white)](https://fixlit-now.vercel.app/api)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-f59e0b?style=for-the-badge)](LICENSE)

</div>

> **Live app:** [https://fixlit.vercel.app](https://fixlit.vercel.app)
> **Backend API:** [https://fixlit-now.vercel.app/api](https://fixlit-now.vercel.app/api)
> **API docs (Postman):** [View collection](https://documenter.getpostman.com/view/49986455/2sBY4LRhJm)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Deployment (Vercel)](#deployment-vercel)
- [Backend](#backend)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**FixItNow** is a full-stack home-services platform that connects customers with
verified technicians for plumbing, electrical, cleaning, AC repair, and more. This
repository contains the **Next.js frontend** that consumes the deployed Express
+ Prisma backend.

The app ships with three role-based experiences:

| Role | Capabilities |
| --- | --- |
| **Customer** | Browse services, filter by category/price/rating, book a slot, pay with Stripe, leave a review |
| **Technician** | Manage services, set availability, accept/decline bookings, view earnings & reviews |
| **Admin** | Manage users, categories, services, bookings, payments, and reviews |

---

## Features

- **Three role-based dashboards** (customer, technician, admin) with
  middleware-enforced route protection.
- **Service marketplace** with category browsing, search, filters, and
  service-detail pages.
- **Booking lifecycle** — `PENDING → ACCEPTED → PAID → COMPLETED` with
  technician accept/decline and customer cancellation.
- **Stripe Checkout** integration with success/cancel landing pages.
- **Reviews & ratings** tied to bookings, services, and technicians.
- **LightRays** WebGL hero background (React Bits-style) with Framer Motion
  animations.
- **Dark mode** with persisted user preference.
- **Fully responsive** — mobile-first layouts across every page.
- **Type-safe** end-to-end with TypeScript, Zod, and React Hook Form.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | [Next.js 15](https://nextjs.org) (App Router) |
| Language | [TypeScript 5](https://www.typescriptlang.org) |
| Styling | [Tailwind CSS 3](https://tailwindcss.com) + shadcn-style primitives |
| Data fetching | [TanStack Query v5](https://tanstack.com/query) + [Axios](https://axios-http.com) |
| State | [Zustand](https://zustand-demo.pmnd.rs) (auth, persisted) |
| Forms | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| Animations | [Framer Motion](https://www.framer.com/motion) |
| 3D / WebGL | [Three.js](https://threejs.org) (LightRays background) |
| Icons | [lucide-react](https://lucide.dev) |
| Payments | [Stripe Checkout](https://stripe.com) |
| Auth | JWT (HTTP-only cookies) via backend |
| Deployment | [Vercel](https://vercel.com) |

---

## Quick Start

### Prerequisites

- **Node.js 20+** (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- **npm** (or pnpm/yarn)
- A running backend (the deployed one works out of the box — no setup needed)

### Installation

```bash
git clone https://github.com/Roisul-Shohan/FixltNow_Frontend.git
cd FixltNow_Frontend/fixitnow-frontend
npm install
cp .env.local.example .env.local
npm run dev
```

The dev server starts on **http://localhost:3000**.

The default `.env.local` points at the deployed backend, so the app works
immediately. To point at a local backend instead, edit `.env.local`:

```env
NEXT_PUBLIC_API_BASE=http://localhost:5000/api
```

---

## Environment Variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_BASE` | No | `https://fixlit-now.vercel.app/api` | Backend API base URL (must include `/api`). Inlined at build time. |

> `NEXT_PUBLIC_*` variables are inlined at build time, so a fresh `dev` or
> deploy is required after changing them.

---

## Project Structure

```
fixitnow-frontend/
├── public/                  # Static assets (images, icons)
├── src/
│   ├── app/                 # Next.js App Router routes
│   │   ├── (auth)/          # Auth pages (login, register)
│   │   ├── (public)/        # Public + role-based dashboards
│   │   │   ├── admin/       # Admin dashboard
│   │   │   ├── customer/    # Customer dashboard
│   │   │   ├── tech/        # Technician dashboard
│   │   │   ├── categories/  # Service categories
│   │   │   ├── services/    # Service catalog & detail
│   │   │   ├── technicians/ # Technician directory
│   │   │   └── dashboard/   # Shared dashboard
│   │   ├── payment/         # Stripe success/cancel landing pages
│   │   ├── layout.tsx       # Root layout (theme, providers)
│   │   └── page.tsx         # Marketing landing page
│   ├── components/
│   │   ├── ui/              # shadcn-style primitives (button, dropdown, …)
│   │   ├── public/          # Public-only components (navbar, footer)
│   │   ├── customer/        # Customer dashboard sidebar & widgets
│   │   ├── tech/            # Technician dashboard sidebar & widgets
│   │   ├── admin/           # Admin dashboard sidebar & widgets
│   │   ├── services/        # Cross-feature components
│   │   ├── technicians/     # Technician browsing components
│   │   └── light-rays.tsx   # React Bits-style WebGL background
│   ├── hooks/               # Zustand stores & custom hooks
│   ├── lib/                 # api, utils, helpers
│   ├── services/            # API service functions
│   └── types/               # Shared TypeScript types
├── .env.local.example       # Template env file (committed)
├── vercel.json              # Vercel CLI deployment config
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server with hot-reload on `http://localhost:3000` |
| `npm run build` | Build the production bundle (`.next/`) |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Run ESLint across the project |

---

## Deployment (Vercel)

The repo ships with a `vercel.json` that declares the Next.js framework so the
Vercel CLI can deploy with zero prompts.

### One-time setup

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

Set in **Vercel → Project → Settings → Environment Variables** (or via
`vercel env add`):

| Key | Value | Environments |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE` | `https://fixlit-now.vercel.app/api` | Production, Preview |

### Pulling env values locally

```bash
vercel env pull .env.local
```

### Inspecting a deployment

```bash
vercel ls                         # list recent deployments
vercel inspect <deployment-url>   # deployment metadata & logs
```

The CLI prints a `https://fixitnow-frontend-*.vercel.app` URL on success.

---

## Backend

This app talks to the **FixltNow Express + Prisma + PostgreSQL** backend.

| Resource | Link |
| --- | --- |
| Live API | [https://fixlit-now.vercel.app/api](https://fixlit-now.vercel.app/api) |
| API docs (Postman) | [View collection](https://documenter.getpostman.com/view/49986455/2sBY4LRhJm) |
| Backend source | [github.com/Roisul-Shohan/FixltNow](https://github.com/Roisul-Shohan/FixltNow) |

The base URL is hard-coded as a fallback in `src/lib/api.ts`; override it by
setting `NEXT_PUBLIC_API_BASE` in `.env.local` (for local dev) or in Vercel's
**Project → Settings → Environment Variables** (for preview/production).

### Backend features

- JWT authentication with HTTP-only cookies (access + refresh tokens)
- Role-based authorization (`ADMIN`, `TECHNICIAN`, `CUSTOMER`)
- Service catalog, categories, availability, and bookings
- Stripe Checkout + verified webhook handling
- Reviews & ratings (aggregated `averageRating` / `totalReviews`)
- Admin controls: user status, category management, oversight
- Prisma + PostgreSQL with global error handling

---

## Contributing

Contributions are welcome!

1. **Fork** the repo and create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Commit** with a clear message:
   ```bash
   git commit -m "feat: add your feature"
   ```
3. **Push** and open a **Pull Request**:
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit convention

This project uses [Conventional Commits](https://www.conventionalcommits.org):

- `feat:` — new feature
- `fix:` — bug fix
- `chore:` — tooling / config changes
- `docs:` — documentation only
- `refactor:` — code change that neither fixes a bug nor adds a feature
- `style:` — formatting / whitespace
- `test:` — adding or updating tests

### Code style

- ESLint is configured for the project — run `npm run lint` before pushing.
- TypeScript strict mode is enabled. All new code must be type-safe.
- Tailwind utility classes only — avoid inline styles for theming.

---

## License

Released under the [MIT License](LICENSE).

---

<div align="center">

Built with ❤️ by [Roisul-Shohan](https://github.com/Roisul-Shohan) ·
[Live demo](https://fixlit.vercel.app) ·
[Report a bug](https://github.com/Roisul-Shohan/FixltNow_Frontend/issues)

</div>
