-- Create trigger to set edited_at equal to created_at on insert
create or replace function set_initial_edited_at()
returns trigger as $$
begin
  new.edited_at = new.created_at;
  return new;
end;
$$ language plpgsql;

create trigger set_analysis_metrics_edited_at
  before insert on analysis_metrics
  for each row
  execute function set_initial_edited_at();