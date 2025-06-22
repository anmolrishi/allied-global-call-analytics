-- Add metric_analysis column to analyses table
alter table analyses 
add column if not exists metric_analysis text;