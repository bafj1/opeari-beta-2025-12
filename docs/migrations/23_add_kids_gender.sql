-- Add optional gender column to kids table
ALTER TABLE kids ADD COLUMN IF NOT EXISTS gender text;

-- No constraint — free text allows flexibility (boy, girl, nonbinary, prefer not to say, etc.)
