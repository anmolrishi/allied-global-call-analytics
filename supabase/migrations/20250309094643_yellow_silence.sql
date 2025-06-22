/*
  # Add Spanish language columns to analysis tables

  1. Changes
    - Add Spanish columns to analyses table:
      - summary_spanish
      - metric_analysis_spanish
    - Add Spanish columns to issues table:
      - category_spanish
      - description_spanish
    - Add Spanish column to recommendations table:
      - content_spanish

  2. Notes
    - All new columns are nullable to maintain compatibility with existing data
    - Existing records will have null values for Spanish columns
*/

-- Add Spanish columns to analyses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analyses' AND column_name = 'summary_spanish'
  ) THEN
    ALTER TABLE analyses ADD COLUMN summary_spanish text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analyses' AND column_name = 'metric_analysis_spanish'
  ) THEN
    ALTER TABLE analyses ADD COLUMN metric_analysis_spanish jsonb;
  END IF;
END $$;

-- Add Spanish columns to issues table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'issues' AND column_name = 'category_spanish'
  ) THEN
    ALTER TABLE issues ADD COLUMN category_spanish text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'issues' AND column_name = 'description_spanish'
  ) THEN
    ALTER TABLE issues ADD COLUMN description_spanish text;
  END IF;
END $$;

-- Add Spanish column to recommendations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recommendations' AND column_name = 'content_spanish'
  ) THEN
    ALTER TABLE recommendations ADD COLUMN content_spanish text;
  END IF;
END $$;