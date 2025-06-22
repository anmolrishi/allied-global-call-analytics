-- Create analysis_metrics table
create table analysis_metrics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table analysis_metrics enable row level security;

-- Create policies
create policy "Users can manage their own metrics"
  on analysis_metrics for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);