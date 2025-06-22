-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create enum types for call status and performance ratings
create type call_status as enum ('pending', 'transcribing', 'analyzing', 'completed', 'failed');
create type performance_rating as enum ('excellent', 'good', 'average', 'poor', 'unacceptable');

-- Create agents table
create table agents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  employee_id text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create calls table
create table calls (
  id uuid primary key default uuid_generate_v4(),
  agent_id uuid references agents(id) on delete cascade,
  file_path text not null,
  duration integer,
  call_date timestamp with time zone not null,
  status call_status default 'pending' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create transcriptions table
create table transcriptions (
  id uuid primary key default uuid_generate_v4(),
  call_id uuid references calls(id) on delete cascade,
  content text not null,
  language text default 'es' not null,
  confidence numeric(4,3),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create analyses table
create table analyses (
  id uuid primary key default uuid_generate_v4(),
  call_id uuid references calls(id) on delete cascade,
  performance_score integer check (performance_score >= 0 and performance_score <= 100),
  rating performance_rating not null,
  summary text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create issues table
create table issues (
  id uuid primary key default uuid_generate_v4(),
  analysis_id uuid references analyses(id) on delete cascade,
  category text not null,
  description text not null,
  severity integer check (severity >= 1 and severity <= 5),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create recommendations table
create table recommendations (
  id uuid primary key default uuid_generate_v4(),
  analysis_id uuid references analyses(id) on delete cascade,
  content text not null,
  priority integer check (priority >= 1 and priority <= 5),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create RLS policies
alter table agents enable row level security;
alter table calls enable row level security;
alter table transcriptions enable row level security;
alter table analyses enable row level security;
alter table issues enable row level security;
alter table recommendations enable row level security;

-- Create policies
create policy "Users can view their own agent profile"
  on agents for select
  using (auth.uid() = user_id);

create policy "Users can view their own calls"
  on calls for select
  using (agent_id in (select id from agents where user_id = auth.uid()));

create policy "Users can view their own transcriptions"
  on transcriptions for select
  using (call_id in (select id from calls where agent_id in (select id from agents where user_id = auth.uid())));

create policy "Users can view their own analyses"
  on analyses for select
  using (call_id in (select id from calls where agent_id in (select id from agents where user_id = auth.uid())));

create policy "Users can view their own issues"
  on issues for select
  using (analysis_id in (select id from analyses where call_id in (select id from calls where agent_id in (select id from agents where user_id = auth.uid()))));

create policy "Users can view their own recommendations"
  on recommendations for select
  using (analysis_id in (select id from analyses where call_id in (select id from calls where agent_id in (select id from agents where user_id = auth.uid()))));

-- Create indexes for better query performance
create index idx_calls_agent_id on calls(agent_id);
create index idx_calls_status on calls(status);
create index idx_transcriptions_call_id on transcriptions(call_id);
create index idx_analyses_call_id on analyses(call_id);
create index idx_issues_analysis_id on issues(analysis_id);
create index idx_recommendations_analysis_id on recommendations(analysis_id);

-- Create functions for updating timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for updating timestamps
create trigger update_agents_updated_at
  before update on agents
  for each row
  execute function update_updated_at_column();

create trigger update_calls_updated_at
  before update on calls
  for each row
  execute function update_updated_at_column();