-- Migration: Add user tracking and click tracking columns to urls table
-- Date: 2026-01-09
-- Purpose: Add missing columns that application code expects

-- Add user tracking column (using email instead of foreign key for simplicity)
ALTER TABLE urls ADD COLUMN IF NOT EXISTS user_email VARCHAR;

-- Add click tracking columns
ALTER TABLE urls ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;
ALTER TABLE urls ADD COLUMN IF NOT EXISTS click_limit INTEGER DEFAULT 1000;

-- Create index for user_email (used for free tier limit queries)
CREATE INDEX IF NOT EXISTS idx_urls_user_email ON urls (user_email);

-- Update existing rows to have default values
UPDATE urls SET click_count = 0 WHERE click_count IS NULL;
UPDATE urls SET click_limit = 1000 WHERE click_limit IS NULL;
