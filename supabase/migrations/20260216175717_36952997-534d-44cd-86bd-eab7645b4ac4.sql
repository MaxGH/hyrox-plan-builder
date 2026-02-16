create table session_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  plan_id uuid references training_plans(id) on delete cascade not null,
  session_id text not null,
  scheduled_date date not null,
  completed boolean default false,
  rpe int check (rpe >= 1 and rpe <= 10),
  notes text check (char_length(notes) <= 200),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, plan_id, session_id, scheduled_date)
);

alter table session_logs enable row level security;

create policy "Users manage own logs"
  on session_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_session_logs_user 
  on session_logs(user_id, scheduled_date);