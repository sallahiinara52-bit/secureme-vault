
-- Albums
create table public.albums (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  color text not null default '#6366f1',
  created_at timestamptz not null default now()
);
alter table public.albums enable row level security;
create policy "own albums select" on public.albums for select using (auth.uid() = user_id);
create policy "own albums insert" on public.albums for insert with check (auth.uid() = user_id);
create policy "own albums update" on public.albums for update using (auth.uid() = user_id);
create policy "own albums delete" on public.albums for delete using (auth.uid() = user_id);

-- Vault files (encrypted)
create table public.vault_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  album_id uuid references public.albums(id) on delete set null,
  name text not null,
  mime text not null,
  size bigint not null default 0,
  storage_path text not null,
  iv text not null,
  salt text not null,
  is_decoy boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.vault_files enable row level security;
create policy "own files select" on public.vault_files for select using (auth.uid() = user_id);
create policy "own files insert" on public.vault_files for insert with check (auth.uid() = user_id);
create policy "own files update" on public.vault_files for update using (auth.uid() = user_id);
create policy "own files delete" on public.vault_files for delete using (auth.uid() = user_id);

-- Intruder logs
create table public.intruder_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  image_path text,
  attempted_at timestamptz not null default now()
);
alter table public.intruder_logs enable row level security;
create policy "own intruder select" on public.intruder_logs for select using (auth.uid() = user_id);
create policy "own intruder insert" on public.intruder_logs for insert with check (auth.uid() = user_id);
create policy "own intruder delete" on public.intruder_logs for delete using (auth.uid() = user_id);

-- Storage bucket (private)
insert into storage.buckets (id, name, public) values ('vault', 'vault', false)
on conflict (id) do nothing;

create policy "vault read own" on storage.objects for select
  using (bucket_id = 'vault' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "vault insert own" on storage.objects for insert
  with check (bucket_id = 'vault' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "vault update own" on storage.objects for update
  using (bucket_id = 'vault' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "vault delete own" on storage.objects for delete
  using (bucket_id = 'vault' and auth.uid()::text = (storage.foldername(name))[1]);
