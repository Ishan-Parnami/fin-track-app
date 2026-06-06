# FinTrack — Personal Finance Dashboard

A full-stack personal finance tracker built with **Next.js 15 App Router** and **TypeScript**. Demonstrates real-world usage of SSG, ISR, SSR, API Routes, Server Actions, Drizzle ORM, and NextAuth v5 — all in a single cohesive application.

---

## Project Overview

FinTrack lets users log income and expense transactions, visualise spending trends with interactive charts, and manage custom categories — all behind a secure authenticated session. The app is designed to be responsive (mobile + desktop), theme-aware (light/dark following system preference), and production-ready on Vercel + Neon.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript (strict) |
| Database | PostgreSQL via [Neon](https://neon.tech) serverless |
| ORM | Drizzle ORM (`drizzle-orm/neon-http`) |
| Auth | NextAuth v5 beta — Google OAuth + Email/Password |
| UI Components | shadcn/ui (Base UI) + Tailwind CSS v4 |
| Icons | Lucide React |
| Charts | Recharts |
| Theming | next-themes (Light / Dark, system-detected default) |
| Validation | Zod v4 + React Hook Form |
| Toasts | Sonner |
| Fonts | Geist Sans + Geist Mono (next/font) |
| Deployment | Vercel + Neon |

---

## Features Implemented

- **Authentication** — Google OAuth and email/password sign-up/login via NextAuth v5. JWT session strategy. Middleware-protected routes.
- **Transactions** — Add, edit, delete, clone, filter (by type/category/month), and paginate income/expense transactions.
- **Clone Transaction** — Pre-fills all original fields into an editable dialog; saves a new row on confirm.
- **Categories** — 10 global default categories (seeded, read-only). Users can add custom categories with emoji icons and hex color pickers.
- **Dashboard** — Summary cards (income, expense, balance, savings rate), 3 simultaneous charts (bar, area, pie) with weekly/monthly/yearly period toggle.
- **Month Selector** — Changes the dashboard summary and chart data via URL search param (`?month=YYYY-MM`).
- **Settings** — Update display name and change password (with current password verification).
- **Theme Toggle** — Two-state light/dark toggle. Initialises to system preference (`prefers-color-scheme`) on first visit.
- **Responsive Layout** — Collapsible sidebar on desktop, slide-in Sheet drawer on mobile.
- **ISR Landing Page** — Public marketing page rebuilt every hour, with a `BUILT_AT` timestamp proving static generation.

---

## How to Run Locally

### Prerequisites
- Node.js 20+
- A PostgreSQL database — [Neon free tier](https://neon.tech) recommended
- A Google OAuth app — [console.cloud.google.com](https://console.cloud.google.com)

### 1. Clone and install
```bash
git clone <your-repo-url>
cd fin-track-app
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env.local
```
Fill in all values (see Environment Variables section below).

### 3. Set up the database
```bash
npm run db:push      # push schema to Neon (no migration files needed)
npm run db:studio    # optional: open Drizzle Studio to inspect tables
```

Then seed the 10 global default categories by running:
```bash
npx tsx lib/db/seed.ts
```

### 4. Run the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Create a `.env.local` file with the following keys:

```env
# Neon PostgreSQL connection string
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# NextAuth
AUTH_SECRET=your-random-secret-at-least-32-chars
AUTH_URL=http://localhost:3000

# Google OAuth (from Google Cloud Console)
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
```

For production on Vercel, add the same keys in the Vercel dashboard and update `AUTH_URL` to your deployed domain. Add `https://your-domain.com/api/auth/callback/google` to Google OAuth's authorised redirect URIs.

---

## Database Setup

Schema is defined in `lib/db/schema.ts` using Drizzle ORM.

### Tables

| Table | Purpose |
|---|---|
| `users` | App users (email/password or OAuth) |
| `accounts` | OAuth provider links (DrizzleAdapter — supports Google, GitHub, Meta, etc.) |
| `sessions` | Session records (DrizzleAdapter) |
| `verification_tokens` | Email verification tokens (DrizzleAdapter) |
| `categories` | Global defaults (`user_id = NULL`) + user-created (`user_id = <uuid>`) |
| `transactions` | Income/expense records linked to user and optional category |

### Commands

```bash
npm run db:generate   # generate SQL migration files from schema
npm run db:push       # push schema directly to Neon (used instead of migrate for serverless)
npm run db:migrate    # run migration files (not recommended with Neon serverless WebSocket issue)
npm run db:studio     # open Drizzle Studio GUI
```

> **Note:** `db:push` is used instead of `db:migrate` because `@neondatabase/serverless` cannot use WebSocket connections required by the migrate command in a local environment.

---

## Routes / Pages

| Route | Type | Description |
|---|---|---|
| `/` | SSG + ISR | Public landing page. Rebuilt every hour. Redirects to `/dashboard` if already signed in. |
| `/auth/login` | CSR (`'use client'`) | Email/password login form + Google OAuth button |
| `/auth/signup` | CSR (`'use client'`) | Registration form — POSTs to `/api/auth/signup`, then signs in |
| `/dashboard` | SSR (`force-dynamic`) | Summary cards, 3 charts, category breakdown, recent transactions |
| `/dashboard/transactions` | SSR (`force-dynamic`) | Paginated transaction list with filters |
| `/dashboard/transactions/[id]` | SSR (`force-dynamic`) | Transaction detail, edit form, clone, delete |
| `/dashboard/categories` | SSR (`force-dynamic`) | Global defaults + user categories; add/edit/delete custom ones |
| `/dashboard/settings` | SSR (`force-dynamic`) | Update name and change password |

---

## API Routes

All API routes live under `app/api/` and return `{ success: true, data }` or `{ success: false, error: { code, message } }`.

| Endpoint | Methods | Description |
|---|---|---|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth handler (OAuth callbacks, session) |
| `/api/auth/signup` | POST | Register new user with email/password |
| `/api/transactions` | GET, POST | List (paginated, filtered) or create transaction |
| `/api/transactions/[id]` | GET, PUT, DELETE | Get, update, or delete a single transaction |
| `/api/categories` | GET, POST | List user + global categories, or create custom category |
| `/api/categories/[id]` | PUT, DELETE | Update or delete a user-owned, non-default category |
| `/api/summary` | GET | Aggregated stats + chart data + recent transactions. Params: `?month=YYYY-MM&period=weekly\|monthly\|yearly` |
| `/api/users/me` | GET, PATCH | Get current user profile or update name/password |

---

## Server Actions

Defined in `lib/actions/` with `'use server'` directive. All actions call `revalidatePath('/dashboard', 'layout')` after mutations so affected pages re-render.

| Action | File | What it does |
|---|---|---|
| `addTransaction` | `transactions.ts` | Validates and inserts a new transaction |
| `updateTransaction` | `transactions.ts` | Validates and updates an existing transaction (ownership check) |
| `deleteTransaction` | `transactions.ts` | Deletes a transaction (ownership check) |
| `cloneTransaction` | `transactions.ts` | Fetches original, inserts a copy with user-confirmed overrides, returns new ID |
| `addCategory` | `categories.ts` | Creates a user-owned category (forces `isDefault = false`) |
| `updateCategory` | `categories.ts` | Updates a category — blocked if `isDefault = true` |
| `deleteCategory` | `categories.ts` | Deletes a category — blocked if `isDefault = true` or referenced by transactions |
| `updateUser` | `users.ts` | Updates display name and/or password (verifies current password first) |

---

## Rendering Strategies

### SSG + ISR — `/`
```ts
export const revalidate = 3600
const BUILT_AT = new Date().toISOString() // set at build time, proves SSG
```
The landing page is statically generated at build time and regenerated in the background every hour. No user data is involved. The `BUILT_AT` timestamp visible in the footer confirms the page was rendered at build time, not per-request.

### SSR — `/dashboard/*`
```ts
export const dynamic = 'force-dynamic'
```
All dashboard pages opt into full server-side rendering on every request. This is required because each page reads from the authenticated session (`auth()`) and queries user-specific data from the database. The data must always be current — caching would return stale transactions or wrong balances.

### CSR — `/auth/*`
```ts
'use client'
```
Auth pages are client-rendered because they are purely interactive forms with client-side validation, `signIn()` calls, and redirect logic. No initial data fetch is needed from the server.

### Client-side data fetching — Charts
The `ChartsSection` component starts with SSR-fetched initial data (no waterfall on first load), then re-fetches `GET /api/summary?period=...` client-side whenever the user changes the period toggle (Weekly / Monthly / Yearly). This keeps the charts responsive without a full page reload.

---

## Concepts Covered

| Concept | Where used |
|---|---|
| App Router file-based routing | All pages under `app/` |
| Server Components (default) | All dashboard pages, layout |
| Client Components (`'use client'`) | Auth forms, sidebar, charts, filters, dialogs |
| Server Actions (`'use server'`) | All data mutations (add/edit/delete/clone) |
| API Route Handlers | Read queries, paginated lists, chart aggregates |
| Middleware | Auth guard on `/dashboard/*`, redirect `/auth/*` and `/` for logged-in users |
| `revalidatePath` | Called after every server action to refresh SSR pages |
| ISR (`revalidate`) | Landing page rebuilt every hour |
| `force-dynamic` | All dashboard pages — disables caching |
| Drizzle ORM | Schema definition, typed queries, joins, aggregates |
| NextAuth v5 (beta) | JWT strategy, DrizzleAdapter, Google OAuth, credentials provider |
| Zod validation | Form schemas, API request validation (server-side) |
| React Hook Form | Client-side form state, validation, submit handling |
| `next-themes` | System-detected default, light/dark toggle persisted to localStorage |
| `Suspense` boundaries | `MonthSelector`, `TransactionFilters` (both use `useSearchParams`) |
| Responsive design | Tailwind breakpoints, collapsible sidebar, mobile Sheet drawer |

---

## Assumptions and Limitations

- **`db:push` over `db:migrate`** — Neon's serverless driver cannot open WebSocket connections required by Drizzle's `migrate()` command locally. `db:push` is used as the equivalent for schema changes.
- **Single categories table** — Global default categories use `user_id = NULL`. User-created categories use `user_id = <uuid>`. Both are fetched with `WHERE user_id = ? OR user_id IS NULL`. Default categories (`is_default = true`) cannot be edited or deleted.
- **JWT sessions** — The credentials provider requires JWT session strategy (database sessions don't work with credentials). This means session data is stored in a signed cookie, not the database `sessions` table.
- **No email verification** — The `emailVerified` column exists on the users table (required by DrizzleAdapter) but email verification flow is not implemented. Users can sign up and immediately log in.
- **Password field is nullable** — Allows the same `users` table to serve both OAuth and email/password users. OAuth users have `password = NULL`.
- **INR currency** — The app is hardcoded to display amounts in Indian Rupees (₹). Currency is not user-configurable.
- **No real-time updates** — Dashboard data reflects the state at request time. There is no WebSocket or polling for live updates.
- **Vercel deployment assumed** — The Neon serverless driver and `neon-http` adapter are chosen specifically for Vercel's serverless function environment. Local development works fine but a traditional `pg` driver would be needed for a long-running server.
