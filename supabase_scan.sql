-- Mobile scan sessions: pair a phone camera with the web dashboard to add books live.
-- Run this in the Supabase SQL editor after supabase_schema.sql.

create extension if not exists "uuid-ossp";

-- A pairing session created by the logged-in web user. Its id is the QR capability token.
create table if not exists scan_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '30 minutes')
);

-- Books scanned by the phone. A scratch queue — never written to `books` directly.
create table if not exists scan_items (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references scan_sessions(id) on delete cascade,
  isbn text,
  title text,
  author text,
  cover_url text,
  year int,
  page_count int,
  genre text,
  created_at timestamptz default now()
);

alter table scan_sessions enable row level security;
alter table scan_items enable row level security;

-- scan_sessions: owner has full access.
drop policy if exists "owner manages own sessions" on scan_sessions;
create policy "owner manages own sessions"
  on scan_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- scan_sessions: the (anonymous) phone may read a session only while it's valid,
-- so it can confirm the pairing before scanning.
drop policy if exists "anyone reads valid session" on scan_sessions;
create policy "anyone reads valid session"
  on scan_sessions for select
  to anon, authenticated
  using (expires_at > now());

-- scan_items: the phone (anon) may insert only into a non-expired session.
drop policy if exists "insert into valid session" on scan_items;
create policy "insert into valid session"
  on scan_items for insert
  to anon, authenticated
  with check (
    exists (select 1 from scan_sessions s where s.id = session_id and s.expires_at > now())
  );

-- scan_items: readable while the session is valid (desktop realtime + phone's own list).
drop policy if exists "read items of valid session" on scan_items;
create policy "read items of valid session"
  on scan_items for select
  to anon, authenticated
  using (
    exists (select 1 from scan_sessions s where s.id = session_id and s.expires_at > now())
  );

-- scan_items: the session owner can clear the queue after saving.
drop policy if exists "owner deletes own items" on scan_items;
create policy "owner deletes own items"
  on scan_items for delete
  using (
    exists (select 1 from scan_sessions s where s.id = session_id and s.user_id = auth.uid())
  );

-- Enable realtime so the desktop receives inserts live.
alter publication supabase_realtime add table scan_items;
