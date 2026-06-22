# ScreenShare

A social movie tracking app. Log movies, rate them, follow friends, and share what you're watching — Letterboxd-style, fully self-hosted.

**Tech stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (Auth + PostgreSQL) · Vercel

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd screenshare
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Once the project is ready, go to **Project Settings → API**.
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Configure env variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run database migrations

In your Supabase project, go to **SQL Editor** and run migration script:


### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

---

## Deploy to Vercel

1. Push your repo to GitHub.
2. Import the project at [vercel.com/new](https://vercel.com/new).
3. Add environment variables in Vercel's project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.

No custom server is required — the app uses Next.js API Routes only.

---

## Features

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Email + password auth |
| Signup | `/signup` | Create account with username |
| Home Feed | `/home` | Activity from you + friends |
| My List | `/movies` | Watched / Want to Watch tabs |
| Add Movie | `/movies/add` | Manual movie entry + instant watchlist add |
| Movie Detail | `/movies/[id]` | Your entry + friend reviews |
| Friends | `/friends` | Search · Requests · Friends list |
| Friend Profile | `/profile/[username]` | Public watched list |
| Messages | `/messages` | DMs with friends (5s polling) |
| Profile | `/profile` | Edit username/bio · Stats · Logout |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

Both are safe to expose in the browser — Supabase RLS handles data access control.


---


*Made by orfegrace*
