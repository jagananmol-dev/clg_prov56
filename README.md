# 🛒 The Dorm Store

> Premium stationery and study essentials for college students — built with Vite + React + TypeScript + Supabase.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)](https://supabase.com)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss)](https://tailwindcss.com)

---

## 📖 Table of Contents

1. [Project Overview](#-project-overview)
2. [Tech Stack](#-tech-stack)
3. [Project Structure](#-project-structure)
4. [Prerequisites](#-prerequisites)
5. [Local Setup Guide](#-local-setup-guide)
6. [Environment Variables](#-environment-variables)
7. [Database Setup (Supabase)](#-database-setup-supabase)
8. [Running Locally](#-running-locally)
9. [Git Workflow](#-git-workflow)
10. [Should You Use Docker?](#-should-you-use-docker)
11. [Deployment](#-deployment)
12. [Contributing](#-contributing)

---

## 🎯 Project Overview

The Dorm Store is a full-featured e-commerce SPA built for college students to buy stationery and study essentials. It features:

- 🛍️ Product listing with category filters, search, price range slider, and sort
- 🛒 Persistent cart (survives page refresh via `localStorage`)
- ❤️ Wishlist with count badge in Navbar
- 🔐 Secure auth — rate limiting, password strength meter, forgot password
- 👤 User account page with order history (queried by UUID, not email)
- 🗄️ Supabase backend — PostgreSQL + Row Level Security + auto-managed Auth
- 🛡️ Separate Express admin API with its own JWT auth, audit logging, and validation middleware

---

## 🧱 Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | Vite + React 18 | Fast HMR, excellent DX |
| **Language** | TypeScript | Type safety across the entire codebase |
| **Styling** | Tailwind CSS v3 | Utility-first, consistent design system |
| **Backend/DB** | Supabase (PostgreSQL) | Managed Postgres, built-in Auth, RLS |
| **Admin API** | Express + TypeScript | Service-role admin operations behind JWT auth |
| **Auth** | Supabase Auth (JWT) | Email/password with session auto-refresh |
| **Icons** | Lucide React | Consistent, tree-shakable icon set |
| **Router** | React Router v6 | Client-side routing with lazy-loaded pages |
| **State** | React Context API | Cart + Auth state — no Redux overhead |

---

## 📁 Project Structure

The repo is split into two independent workspaces — `frontend/` (Vite + React store & admin SPA) and `backend/` (Express admin API) — orchestrated from the root `package.json`. Database schema lives in `supabase/` since both workspaces talk to Supabase.

```
project/
│
├── package.json                 # Root orchestrator only — `npm run dev` runs store+admin+backend together
├── render.yaml                  # Render deploy config for the backend (rootDir: backend)
├── scripts/
│   └── start-dev.js             # Frees dev ports (3000/5173/4000) before starting all three servers
│
├── supabase/
│   └── migrations/
│       ├── 20260726165403_create_stationery_schema.sql       # Initial schema (products, orders, order_items)
│       ├── 20260726171514_create_products_storage_bucket.sql # Storage bucket for product images
│       └── 20260805_robust_auth_schema.sql                   # profiles table, user_id FK, strict RLS
│
├── backend/                      # Express admin API (Supabase service_role access)
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                      # 🔒 Backend secrets (never commit this)
│   └── src/
│       ├── index.ts              # Server entry point
│       ├── config.ts             # Env-driven config
│       ├── lib/
│       │   └── supabase.ts       # Service-role Supabase client
│       ├── middleware/           # Express middleware
│       │   ├── auth.middleware.ts       # JWT verification
│       │   ├── validate.middleware.ts   # Zod request validation
│       │   └── audit.middleware.ts      # Admin action audit logging
│       └── routes/               # One router per resource
│           ├── auth.routes.ts
│           ├── categories.routes.ts
│           ├── orders.routes.ts
│           ├── products.routes.ts
│           ├── reviews.routes.ts
│           ├── thoughts.routes.ts
│           └── upload.routes.ts
│
└── frontend/                     # Vite + React store & admin SPA
    ├── index.html                 # Store HTML entry point (SEO meta tags)
    ├── index-admin.html           # Admin HTML entry point
    ├── package.json
    ├── vite.config.ts             # Store config + path alias (@/ → src/)
    ├── vite.admin.config.ts       # Admin config (separate entry/port)
    ├── tailwind.config.js         # Tailwind content paths
    ├── tsconfig.json              # TypeScript compiler options
    ├── vercel.json                # Store deploy config
    ├── vercel.admin.json          # Admin deploy config
    ├── .env                       # 🔒 Local secrets (never commit this)
    ├── .env.example               # Template for env variables (safe to commit)
    │
    ├── scripts/
    │   └── copy-admin-index.js    # Post-build step for the admin bundle
    │
    ├── public/
    │   └── images/
    │       └── logo.png           # App logo (used in Navbar and favicon)
    │
    └── src/
        ├── main.tsx                # Store entry point
        ├── main-admin.tsx          # Admin entry point
        ├── StoreApp.tsx            # Store root component: routing + providers + code splitting
        ├── AdminApp.tsx            # Admin root component
        ├── index.css               # Global styles + Tailwind directives + custom utilities
        ├── vite-env.d.ts           # TypeScript types for import.meta.env
        │
        ├── lib/
        │   └── supabase.ts         # Supabase client singleton (anon key)
        │
        ├── hooks/
        │   ├── useDebounce.ts      # Generic debounce hook (used by search + price slider)
        │   └── useProducts.ts      # Product data fetching hook
        │
        ├── data/
        │   └── products.ts         # Static product + category data (TypeScript, no API call)
        │
        ├── context/
        │   ├── AuthContext.tsx      # Store auth state: signIn, signUp, signOut, resetPassword
        │   ├── AdminAuthContext.tsx # Admin auth state
        │   └── CartContext.tsx      # Cart + wishlist state (persisted to localStorage)
        │
        ├── components/              # Reusable UI components (used across multiple pages)
        │   ├── Navbar.tsx            # Sticky top nav: search, wishlist badge, cart badge, user indicator
        │   ├── Footer.tsx            # Site footer
        │   ├── Logo.tsx              # Logo image component
        │   ├── ProductCard.tsx       # Product tile: image, title, rating, price, wishlist toggle
        │   ├── Hero.tsx              # Home page hero section
        │   ├── Features.tsx          # Home page features/USP section
        │   ├── Categories.tsx        # Home page category grid
        │   ├── BestSelling.tsx       # Home page top-5 products carousel
        │   ├── SaleBanner.tsx        # Promotional sale banner
        │   ├── Testimonials.tsx      # Customer reviews section
        │   └── admin/
        │       └── AdminRoute.tsx    # Admin route guard
        │
        └── pages/                   # Route-level components (each is a lazy-loaded JS chunk)
            ├── Home.tsx              # Landing page (assembles Home section components)
            ├── Shop.tsx              # Product listing with filters, sort, search
            ├── ProductDetail.tsx     # Single product view: images, details, add to cart
            ├── Cart.tsx              # Shopping cart with quantity controls and checkout
            ├── Wishlist.tsx          # Saved products grid with "Add all to cart" shortcut
            ├── Account.tsx           # User profile + order history (guarded route)
            ├── AuthPage.tsx          # Login + Signup (rate limiting, password strength meter)
            └── admin/                # Admin pages (dashboard, products, orders, categories, reviews, thoughts)
```

---

## ✅ Prerequisites

Make sure you have these installed before starting:

| Tool | Minimum Version | Check |
|---|---|---|
| **Node.js** | v18.x or higher | `node --version` |
| **npm** | v9.x or higher | `npm --version` |
| **Git** | any recent version | `git --version` |

You also need a free **Supabase account** at [supabase.com](https://supabase.com).

---

## 🚀 Local Setup Guide

### Step 1 — Clone the repository

```bash
git clone https://github.com/jagananmol-dev/clg_prov56.git
cd clg_prov56
```

### Step 2 — Install dependencies

This installs the root orchestrator's own tiny dev deps (`concurrently`, `kill-port`). The two workspaces (`frontend/`, `backend/`) have separate `package.json` files and need their own installs:

```bash
npm install
npm run install:all   # installs frontend/ and backend/ dependencies
```

### Step 3 — Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Choose a region close to India (e.g. `ap-south-1`)
3. Save your **database password** securely
4. Wait for provisioning (~1 minute)

### Step 4 — Set up environment variables

```bash
# Frontend (store + admin SPA)
cp frontend/.env.example frontend/.env

# Backend (Express admin API)
cp backend/.env.example backend/.env
```

Open `frontend/.env` and fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Find these in Supabase Dashboard → **Project Settings → API**. See `backend/.env.example` for the backend's own required variables (service role key, JWT secret, admin credentials).

> ⚠️ **Never commit `.env` files to git.** They are listed in `.gitignore`.

### Step 5 — Run database migrations

In your Supabase Dashboard → **SQL Editor**, run **every** file in `supabase/migrations/`, **in filename order** (each one's date prefix is also its run order — some tighten RLS policies a prior file left too open, so skipping ahead or running out of order can leave you on a less-secure intermediate state):

```
supabase/migrations/20260726165403_create_stationery_schema.sql
supabase/migrations/20260726171514_create_products_storage_bucket.sql
supabase/migrations/20260805_admin_reviews_table.sql
supabase/migrations/20260805_robust_auth_schema.sql
supabase/migrations/20260806_add_is_featured.sql
supabase/migrations/20260806_create_storage_bucket.sql
supabase/migrations/20260806_student_thoughts_table.sql
supabase/migrations/20260806_wishlists_table.sql
supabase/migrations/20260810_phone_otp_and_profile.sql
supabase/migrations/20260825_orders_payment_id.sql
supabase/migrations/20260825_orders_payment_method.sql
supabase/migrations/20260825_remove_otp_verification.sql
supabase/migrations/20260826_product_availability.sql
supabase/migrations/20260827_lock_down_products_bucket.sql
```

Copy-paste each file's content into the SQL editor and click **Run**. If you set this project up before 2026-08-27, at minimum go back and run the last one — it closes a storage bucket permission gap that earlier files never revoked.

### Step 6 — Start the dev server

```bash
npm run dev
```

This starts all three servers together: 🛒 store on **http://localhost:3000**, 🛡️ admin on **http://localhost:5173**, ⚙️ backend API on **http://localhost:4000**.

---

## 🔐 Environment Variables

| Variable | Where | Required |
|---|---|---|
| `VITE_SUPABASE_URL` | `frontend/.env` — Supabase → Project Settings → API → Project URL | ✅ Yes |
| `VITE_SUPABASE_ANON_KEY` | `frontend/.env` — Supabase → Project Settings → API → `anon` / `public` key | ✅ Yes |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_JWT_SECRET` | `backend/.env` — see `backend/.env.example` | ✅ Yes |

Template files are already in the repo — copy them as shown in Step 4 above.

---

## 🗄️ Database Setup (Supabase)

### Schema overview

```
auth.users          (managed by Supabase Auth)
    │
    ├── profiles     id UUID PK → auth.users(id)   full_name, phone, timestamps
    │
    └── orders       id UUID PK, user_id → auth.users(id)
            │        customer_name, customer_email, total, status, created_at
            │
            └── order_items   id UUID PK, order_id → orders(id)
                              product_id, product_name, price, quantity
```

### Row Level Security (RLS)

Every table has RLS **enabled**. Users can only access rows they own:

| Table | Policy |
|---|---|
| `profiles` | `id = auth.uid()` |
| `orders` | `user_id = auth.uid()` |
| `order_items` | parent `order.user_id = auth.uid()` |

### Auto profile creation

A PostgreSQL trigger (`on_auth_user_created`) automatically inserts a row into `profiles` whenever a new user signs up, copying `full_name` from auth metadata.

---

## ▶️ Running Locally

All commands run from the repo root and delegate into the relevant workspace:

| Command | What it does |
|---|---|
| `npm run dev` | Start store + admin + backend together (ports 3000 / 5173 / 4000) |
| `npm run dev:store` | Start only the store dev server |
| `npm run dev:admin` | Start only the admin dev server |
| `npm run dev:backend` | Start only the backend dev server |
| `npm run build` | Build the store's production bundle to `frontend/dist/` |
| `npm run build:admin` | Build the admin production bundle |
| `npm run build:backend` | Compile the backend to `backend/dist/` |
| `npm run lint` | Run ESLint on the frontend |
| `npm run typecheck` | Type-check the frontend |
| `npm run test` | Run the frontend test suite |

---

## 🌿 Git Workflow

### Branching strategy

```
main           ← stable, always deployable
  └── dev      ← integration branch
        └── feature/your-feature-name   ← your work
```

### Day-to-day workflow

```bash
# 1. Always start from an updated main
git checkout main
git pull origin main

# 2. Create a feature branch
git checkout -b feature/product-reviews

# 3. Make your changes, then commit
git add .
git commit -m "feat: add product review system"

# 4. Push and open a pull request
git push origin feature/your-feature-name
# → open PR on GitHub: base: main, compare: your branch
```

### Commit message format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add wishlist page
fix: correct ₹ currency symbol in Account.tsx
chore: remove unused .bolt directory
refactor: move auth logic into AuthContext
docs: update README setup guide
```

### Pulling updates from teammates

```bash
git checkout main
git pull origin main        # get latest changes
git checkout your-branch
git rebase main             # replay your commits on top of latest main
```

---

### Bottom line

This project is a **static SPA** frontend plus a small **Express** admin API. The frontend's build output is just HTML/CSS/JS files — Vercel or Netlify can host it for free in seconds. The backend is a lightweight Node process, easily hosted on Render (see `render.yaml`). Docker would add Docker Desktop memory overhead (~2 GB RAM) and Dockerfile/compose maintenance — not worth it at this scale.

**Use Docker when:** the team needs the backend to run in a specific containerized environment locally or in CI.

---

## 🚢 Deployment

### Frontend — Vercel (Recommended, Free)

The frontend lives in `frontend/`, so each Vercel project's **Root Directory** setting must point there (Project Settings → General → Root Directory → `frontend`). Two separate Vercel projects deploy from this one repo:

- **Store**: build command `npm run build`, config `frontend/vercel.json`
- **Admin**: build command `npm run build:admin`, config `frontend/vercel.admin.json`

```bash
npm install -g vercel
cd frontend
vercel --prod
```

Add your environment variables in the Vercel dashboard → Project Settings → Environment Variables.

> ⚠️ If you're updating an existing Vercel project after this repo's frontend/backend split, update its **Root Directory** to `frontend` in the dashboard — the `.vercel/project.json` link now lives at `frontend/.vercel/`.

### Backend — Render

Deploys from `render.yaml` at the repo root, which already sets `rootDir: backend`. Create a Render Blueprint pointing at this repo and it will pick up the config automatically — no root directory change needed here.

### Alternative — Netlify (frontend)

```bash
cd frontend
npm run build
# Drag and drop the frontend/dist/ folder to netlify.com/drop
```

### Alternative — GitHub Pages (frontend)

```bash
cd frontend
npm run build
# Push frontend/dist/ to gh-pages branch using gh-pages package
```

---

## 🤝 Contributing

1. **Fork** this repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit with a clear message following [Conventional Commits](https://www.conventionalcommits.org/)
4. Push and open a **Pull Request** against `main`
5. Wait for review — no direct pushes to `main`

### Code style rules

- **Components**: PascalCase filenames (`ProductCard.tsx`, `AuthPage.tsx`)
- **Hooks**: camelCase with `use` prefix (`useDebounce.ts`, `useCart`)
- **Contexts**: PascalCase with `Context` suffix (`CartContext.tsx`)
- **Pages**: PascalCase, one file per route (`Shop.tsx`, `Wishlist.tsx`)
- **Utilities/lib**: camelCase (`supabase.ts`)
- Every new file must have a **`@file` JSDoc comment** explaining its purpose

---

## 📄 License

MIT — feel free to use this as a starter for your own projects.
