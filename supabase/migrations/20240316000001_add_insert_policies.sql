-- Add insert policies for agents table
create policy "Users can create their own agent profile"
  on agents for insert
  with check (auth.uid() = user_id);

-- Add insert policies for calls table
create policy "Users can insert their own calls"
  on calls for insert
  with check (agent_id in (select id from agents where user_id = auth.uid()));

-- Add storage policies for call recordings
create policy "Users can upload call recordings"
  on storage.objects for insert
  with check (bucket_id = 'call-recordings' and auth.role() = 'authenticated');

create policy "Users can read their own call recordings"
  on storage.objects for select
  using (bucket_id = 'call-recordings' and auth.role() = 'authenticated');

-- Create storage bucket if it doesn't exist
insert into storage.buckets (id, name)
values ('call-recordings', 'call-recordings')
on conflict do nothing;