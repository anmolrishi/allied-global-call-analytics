-- Add edited_at column to analysis_metrics table
alter table analysis_metrics 
add column if not exists edited_at timestamp with time zone;

-- Update existing rows to set edited_at equal to created_at
update analysis_metrics 
set edited_at = created_at 
where edited_at is null;

-- Make edited_at not null after setting initial values
alter table analysis_metrics 
alter column edited_at set not null;

-- Create trigger to update edited_at on each update
create or replace function update_edited_at_column()
returns trigger as $$
begin
  new.edited_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_analysis_metrics_edited_at
  before update on analysis_metrics
  for each row
  execute function update_edited_at_column();