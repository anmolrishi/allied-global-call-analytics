-- Add processing_details column to calls table
alter table calls add column if not exists processing_details text;