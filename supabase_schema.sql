create extension if not exists "uuid-ossp";

create table if not exists books (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  
  -- core (obbligatori)
  title text not null,
  author text not null,
  
  -- da API (opzionali, auto-popolati)
  year int,
  bio text,
  cover_url text,
  isbn text,
  genre text,
  page_count int,
  
  -- utente
  status text not null default 'unread' check (status in ('unread','reading','read')),
  current_page int default 0,
  rating int check (rating >= 1 and rating <= 5),
  notes text,
  tags text[] default '{}',
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table books enable row level security;

create policy "Utenti vedono solo i propri libri"
  on books for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- updated_at automatico
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger books_updated_at
  before update on books
  for each row execute function update_updated_at();
