-- Add insert policies for transcriptions
create policy "Service can insert transcriptions for user's calls"
  on transcriptions for insert
  with check (
    call_id in (
      select id from calls
      where agent_id in (
        select id from agents
        where user_id = auth.uid()
      )
    )
  );

-- Add insert policies for analyses
create policy "Service can insert analyses for user's calls"
  on analyses for insert
  with check (
    call_id in (
      select id from calls
      where agent_id in (
        select id from agents
        where user_id = auth.uid()
      )
    )
  );

-- Add insert policies for issues
create policy "Service can insert issues for user's analyses"
  on issues for insert
  with check (
    analysis_id in (
      select a.id from analyses a
      join calls c on c.id = a.call_id
      join agents ag on ag.id = c.agent_id
      where ag.user_id = auth.uid()
    )
  );

-- Add insert policies for recommendations
create policy "Service can insert recommendations for user's analyses"
  on recommendations for insert
  with check (
    analysis_id in (
      select a.id from analyses a
      join calls c on c.id = a.call_id
      join agents ag on ag.id = c.agent_id
      where ag.user_id = auth.uid()
    )
  );

-- Add update policy for calls status
create policy "Service can update status of user's calls"
  on calls for update
  using (
    agent_id in (
      select id from agents
      where user_id = auth.uid()
    )
  )
  with check (
    agent_id in (
      select id from agents
      where user_id = auth.uid()
    )
  );