# FixItNow — Multi-Folder Workspace

This workspace contains three sibling projects for the FixItNow home-services platform:

```
FixltNow_Frontend/
├── FixltNow-Backend/       # Forked backend (Express + Prisma + Postgres + Stripe)
├── fixitnow-frontend/      # NEW Next.js 15 frontend (this is what we build)
└── .gitignore              # Ignores all *.env*, .puku/, .next/, FixltNow-Backend/
```

## Backend
Original repo: https://github.com/Roisul-Shohan/FixltNow
Live API: https://fixlit-now.vercel.app/

## Frontend
- **Next.js 15** App Router + TypeScript
- **shadcn/ui** for components
- **Framer Motion** for animations
- **LightRays** (React Bits) for hero backgrounds
- **Zod + React Hook Form** for form validation
- **TanStack Query** for data fetching
- **Next.js Middleware** for role-based route protection

## Environment variables
Copy `.env.example` → `.env` in each sub-project. Production secrets live in Vercel.

To pull latest production values for the backend:
```powershell
cd FixltNow-Backend
vercel env pull .env.production
```

## Folder policy
The root `.gitignore` excludes `FixltNow-Backend/` so backend changes push from **its own repo**.
The `fixitnow-frontend/` folder is what we push from the root repository.
