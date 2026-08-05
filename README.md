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

---

## 🧱 Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | Vite + React 18 | Fast HMR, excellent DX |
| **Language** | TypeScript | Type safety across the entire codebase |
| **Styling** | Tailwind CSS v3 | Utility-first, consistent design system |
| **Backend/DB** | Supabase (PostgreSQL) | Managed Postgres, built-in Auth, RLS |
| **Auth** | Supabase Auth (JWT) | Email/password with session auto-refresh |
| **Icons** | Lucide React | Consistent, tree-shakable icon set |
| **Router** | React Router v6 | Client-side routing with lazy-loaded pages |
| **State** | React Context API | Cart + Auth state — no Redux overhead |

---

## 📁 Project Structure

```
project/
│
├── index.html                  # HTML entry point with SEO meta tags
├── vite.config.ts              # Vite + path aliases (@/ → src/)
├── tailwind.config.js          # Tailwind content paths
├── tsconfig.json               # TypeScript compiler options
├── .env                        # 🔒 Local secrets (never commit this)
├── .env.example                # Template for env variables (safe to commit)
│
├── public/
│   └── images/
│       └── logo.png            # App logo (used in Navbar and favicon)
│
├── supabase/
│   └── migrations/
│       ├── 20260726165403_create_stationery_schema.sql   # Initial schema (products, orders, order_items)
│       ├── 20260726171514_create_products_storage_bucket.sql # Storage bucket for product images
│       └── 20260805_robust_auth_schema.sql               # profiles table, user_id FK, strict RLS
│
└── src/
    ├── main.tsx                # React app entry point
    ├── App.tsx                 # Root component: routing + providers + code splitting
    ├── index.css               # Global styles + Tailwind directives + custom utilities
    ├── vite-env.d.ts           # TypeScript types for import.meta.env
    │
    ├── lib/
    │   └── supabase.ts         # Supabase client singleton
    │
    ├── hooks/
    │   └── useDebounce.ts      # Generic debounce hook (used by search + price slider)
    │
    ├── data/
    │   └── products.ts         # Static product + category data (TypeScript, no API call)
    │
    ├── context/
    │   ├── AuthContext.tsx      # Auth state: signIn, signUp, signOut, resetPassword
    │   └── CartContext.tsx      # Cart + wishlist state (persisted to localStorage)
    │
    ├── components/             # Reusable UI components (used across multiple pages)
    │   ├── Navbar.tsx           # Sticky top nav: search, wishlist badge, cart badge, user indicator
    │   ├── Footer.tsx           # Site footer
    │   ├── Logo.tsx             # Logo image component
    │   ├── ProductCard.tsx      # Product tile: image, title, rating, price, wishlist toggle
    │   ├── Hero.tsx             # Home page hero section
    │   ├── Features.tsx         # Home page features/USP section
    │   ├── Categories.tsx       # Home page category grid
    │   ├── BestSelling.tsx      # Home page top-5 products carousel
    │   ├── SaleBanner.tsx       # Promotional sale banner
    │   └── Testimonials.tsx     # Customer reviews section
    │
    └── pages/                  # Route-level components (each is a lazy-loaded JS chunk)
        ├── Home.tsx             # Landing page (assembles Home section components)
        ├── Shop.tsx             # Product listing with filters, sort, search
        ├── ProductDetail.tsx    # Single product view: images, details, add to cart
        ├── Cart.tsx             # Shopping cart with quantity controls and checkout
        ├── Wishlist.tsx         # Saved products grid with "Add all to cart" shortcut
        ├── Account.tsx          # User profile + order history (guarded route)
        └── AuthPage.tsx         # Login + Signup (rate limiting, password strength meter)
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

```bash
npm install
```

### Step 3 — Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Choose a region close to India (e.g. `ap-south-1`)
3. Save your **database password** securely
4. Wait for provisioning (~1 minute)

### Step 4 — Set up environment variables

```bash
# Copy the example file
cp .env.example .env
```

Open `.env` and fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Find these in Supabase Dashboard → **Project Settings → API**.

> ⚠️ **Never commit `.env` to git.** It is listed in `.gitignore`.

### Step 5 — Run database migrations

In your Supabase Dashboard → **SQL Editor**, run each migration file in order:

```
supabase/migrations/20260726165403_create_stationery_schema.sql
supabase/migrations/20260726171514_create_products_storage_bucket.sql
supabase/migrations/20260805_robust_auth_schema.sql
```

Copy-paste each file's content into the SQL editor and click **Run**.

### Step 6 — Start the dev server

```bash
npm run dev
```

The app will be running at **http://localhost:5173** 🎉

---

## 🔐 Environment Variables

| Variable | Where to find it | Required |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL | ✅ Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` / `public` key | ✅ Yes |

Create an `.env.example` template (already in repo):

```env
# Copy this file to .env and fill in your values
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

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

## 🔐 Admin System Setup

The admin panel is powered by a **separate Express.js backend** (`backend/`) that uses Supabase's `service_role` key to bypass RLS and get full database access.

### Step 1 — Configure backend environment

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and fill in your Supabase **service_role** key (found in Supabase Dashboard → Project Settings → API → `service_role` key):

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJh...  ← service_role key (NOT anon key)
ADMIN_EMAIL=admin@dormstore.com
ADMIN_PASSWORD_HASH=$2a$12$...     ← bcrypt hash of your password
ADMIN_JWT_SECRET=...               ← long random string
```

### Step 2 — Generate your admin password hash

```bash
cd backend
node -e "require('bcryptjs').hash('YourNewPassword', 12).then(h => console.log(h))"
```

Paste the output into `ADMIN_PASSWORD_HASH` in `backend/.env`.

### Step 3 — Add admin API URL to frontend `.env`

```env
# In project/.env (frontend)
VITE_ADMIN_API_URL=http://localhost:4000
```

### Step 4 — Run database migration

In Supabase Dashboard → SQL Editor, run:
```
supabase/migrations/20260805_admin_reviews_table.sql
```

This creates the `reviews` table and tightens product/category write permissions (only the backend service_role can write products now).

### Step 5 — Start the admin backend

```bash
# In a NEW terminal (keep the frontend running in another)
cd backend
npm run dev
```

Backend starts at **http://localhost:4000**. You'll see:
```
[SERVER] Admin API running on http://localhost:4000
[SERVER] Accepting requests from: http://localhost:5173
```

### Step 6 — Open the admin panel

Go to **http://localhost:5173/admin/login** and sign in with:
- **Email:** `admin@dormstore.com` (or whatever you set)
- **Password:** the plain-text password you hashed in Step 2

### Admin Panel Routes

| Route | Purpose |
|---|---|
| `/admin/login` | Admin login (5 attempts/15 min rate limit) |
| `/admin` | Dashboard — live stats |
| `/admin/products` | Add/delete products |
| `/admin/orders` | View all orders, cancel any order |
| `/admin/reviews` | View all reviews, delete any review |

### Admin API Security Summary

| Protection | Detail |
|---|---|
| **Password** | bcrypt (cost 12) — never stored as plain text |
| **Session** | JWT (HS256, 2h expiry) stored in `sessionStorage` — clears on tab close |
| **Rate limit** | 5 login attempts per 15 minutes per IP |
| **Headers** | Helmet.js — 12 security headers (CSP, HSTS, X-Frame-Options…) |
| **CORS** | Only `FRONTEND_ORIGIN` can call the API |
| **Input** | Zod validates every request body |
| **DB key** | `service_role` stays in `backend/.env` — never reaches the browser |
| **Audit** | Every POST/PATCH/DELETE logged: timestamp + endpoint + admin email + status |

---

## ▶️ Running Locally

| Command | What it does |
|---|---|
| `npm run dev` | Start Vite dev server with HMR at localhost:5173 |
| `npm run build` | Build production bundle to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint on the `src/` directory |

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

## 🐳 Should You Use Docker?

### Short answer: **No, not for local development.**

Here is the full reasoning:

| Scenario | Docker? | Why |
|---|---|---|
| **Local development** | ❌ No | Vite's dev server + `npm run dev` is instant. Docker adds overhead with zero benefit here. |
| **Supabase backend** | ❌ No | Supabase is a fully managed cloud service. You don't run it locally. |
| **Team with mixed OS** (Windows + Mac + Linux) | ⚠️ Optional | Docker ensures identical Node versions. But `.nvmrc` + nvm achieves the same with less friction. |
| **CI/CD pipeline** (GitHub Actions) | ✅ Yes | Use the official `node:18` Docker image in Actions for consistent builds. |
| **Deploying the frontend** | ❌ No | Deploy the `dist/` output to Vercel, Netlify, or GitHub Pages — all free and Docker-free. |
| **If you add a custom Node.js backend** | ✅ Yes | Docker Compose would manage frontend + backend + any services. |

### Bottom line

This project is a **static SPA** — the build output is just HTML/CSS/JS files. Vercel or Netlify can host it for free in seconds. Docker would add Docker Desktop memory overhead (~2 GB RAM), a `Dockerfile`, and `docker-compose.yml` maintenance — none of which gives you anything useful for this architecture.

**Use Docker when:** you add a custom Express/FastAPI backend that the team needs to run locally with a specific environment.

---

## 🚢 Deployment

### Option A — Vercel (Recommended, Free)

```bash
npm install -g vercel
vercel --prod
```

Add your environment variables in the Vercel dashboard → Project Settings → Environment Variables.

### Option B — Netlify

```bash
npm run build
# Drag and drop the dist/ folder to netlify.com/drop
```

### Option C — GitHub Pages

```bash
npm run build
# Push dist/ to gh-pages branch using gh-pages package
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
