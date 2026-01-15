-- Migration: Add plan column to users table (if not exists)
-- Date: 2026-01-14
-- Purpose: Support premium plan flag for extended URL limits

-- Add plan column with default 'free' for existing and new users
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR DEFAULT 'free';

-- Ensure all existing users have a plan set
UPDATE users SET plan = 'free' WHERE plan IS NULL;
