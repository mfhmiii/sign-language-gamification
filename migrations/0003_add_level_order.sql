-- Add order column if it doesn't exist
ALTER TABLE quiz_level ADD COLUMN IF NOT EXISTS "order" integer;

-- Update existing rows with order based on name (temporary solution)
WITH ordered_levels AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) as row_num
  FROM quiz_level
)
UPDATE quiz_level
SET "order" = ol.row_num
FROM ordered_levels ol
WHERE quiz_level.id = ol.id;

-- Make order column not null after populating it
ALTER TABLE quiz_level ALTER COLUMN "order" SET NOT NULL; 