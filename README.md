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

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run database migrations

In your Supabase project, go to **SQL Editor** and run the following migration script:

```sql
-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ──────────────────────────────────────────
-- TABLES
-- ──────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  bio text,
  created_at timestamptz default now() not null
);

create table public.movies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  year int,
  poster_url text,
  created_at timestamptz default now() not null
);

create type public.watch_status as enum ('watched', 'want_to_watch');

create table public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  movie_id uuid references public.movies(id) on delete cascade not null,
  status public.watch_status not null,
  rating int check (rating >= 1 and rating <= 5),
  review text,
  created_at timestamptz default now() not null,
  unique(user_id, movie_id)
);

create type public.friendship_status as enum ('pending', 'accepted');

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references auth.users(id) on delete cascade not null,
  addressee_id uuid references auth.users(id) on delete cascade not null,
  status public.friendship_status default 'pending' not null,
  created_at timestamptz default now() not null,
  unique(requester_id, addressee_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references auth.users(id) on delete cascade not null,
  receiver_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  read boolean default false not null,
  created_at timestamptz default now() not null
);

-- ──────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ──────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.movies enable row level security;
alter table public.watchlist enable row level security;
alter table public.friendships enable row level security;
alter table public.messages enable row level security;

-- profiles: anyone can read, only owner can update
create policy "Profiles are publicly readable"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- movies: owner can CRUD; friends can read
create policy "Users can manage their own movies"
  on public.movies for all using (auth.uid() = user_id);

create policy "Friends can read each other's movies"
  on public.movies for select using (
    exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and (
          (f.requester_id = auth.uid() and f.addressee_id = movies.user_id)
          or
          (f.addressee_id = auth.uid() and f.requester_id = movies.user_id)
        )
    )
  );

-- watchlist: owner can CRUD; friends can read
create policy "Users can manage their own watchlist"
  on public.watchlist for all using (auth.uid() = user_id);

create policy "Friends can read each other's watchlist"
  on public.watchlist for select using (
    exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and (
          (f.requester_id = auth.uid() and f.addressee_id = watchlist.user_id)
          or
          (f.addressee_id = auth.uid() and f.requester_id = watchlist.user_id)
        )
    )
  );

-- friendships: users can see requests they're part of
create policy "Users can view their own friendships"
  on public.friendships for select using (
    auth.uid() = requester_id or auth.uid() = addressee_id
  );

create policy "Users can send friend requests"
  on public.friendships for insert with check (auth.uid() = requester_id);

create policy "Addressee can update friendship status"
  on public.friendships for update using (auth.uid() = addressee_id);

create policy "Either party can delete a friendship"
  on public.friendships for delete using (
    auth.uid() = requester_id or auth.uid() = addressee_id
  );

-- messages: only sender and receiver can read
create policy "Users can read their own messages"
  on public.messages for select using (
    auth.uid() = sender_id or auth.uid() = receiver_id
  );

create policy "Users can send messages"
  on public.messages for insert with check (auth.uid() = sender_id);

create policy "Receiver can mark messages as read"
  on public.messages for update using (auth.uid() = receiver_id);

-- ──────────────────────────────────────────
-- INDEXES
-- ──────────────────────────────────────────

create index on public.watchlist (user_id);
create index on public.watchlist (movie_id);
create index on public.movies (user_id);
create index on public.friendships (requester_id);
create index on public.friendships (addressee_id);
create index on public.messages (sender_id);
create index on public.messages (receiver_id);
create index on public.messages (read) where read = false;
```

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
