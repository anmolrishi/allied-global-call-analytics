-- Re-enable RLS for analysis_metrics table
alter table analysis_metrics enable row level security;

-- Drop existing policies if any
drop policy if exists "Users can manage their own metrics" on analysis_metrics;

-- Create new policies
create policy "Users can manage their own metrics"
  on analysis_metrics for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Create index for better query performance
create index if not exists idx_analysis_metrics_user_id on analysis_metrics(user_id);