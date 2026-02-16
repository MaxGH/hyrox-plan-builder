
create table public.training_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  status text not null default 'pending',
  onboarding_data jsonb,
  plan_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.training_plans enable row level security;

create policy "Users can read own plan"
  on public.training_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert own plan"
  on public.training_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own plan"
  on public.training_plans for delete
  using (auth.uid() = user_id);

create index idx_training_plans_user_id on public.training_plans(user_id);
create index idx_training_plans_status on public.training_plans(status);

alter publication supabase_realtime add table public.training_plans;
