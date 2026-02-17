
create table hyrox_events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  race_date date not null,
  created_at timestamptz default now(),
  unique (name, race_date)
);

alter table hyrox_events enable row level security;

create policy "Public can read events"
  on hyrox_events for select
  using (true);

create index idx_hyrox_events_date 
  on hyrox_events(race_date);
