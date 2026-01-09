-- Migrations for Users and Limits

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR NOT NULL UNIQUE,
    password_hash VARCHAR NOT NULL,
    plan VARCHAR DEFAULT 'free',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);
CREATE INDEX IF NOT EXISTS ix_users_id ON users (id);

-- Add columns to urls table
ALTER TABLE urls ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE urls ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;
ALTER TABLE urls ADD COLUMN IF NOT EXISTS click_limit INTEGER DEFAULT 1000;

-- Add foreign key
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_urls_users') THEN 
        ALTER TABLE urls 
        ADD CONSTRAINT fk_urls_users 
        FOREIGN KEY (user_id) 
        REFERENCES users (id);
    END IF; 
END $$;

-- Create index for user_id
CREATE INDEX IF NOT EXISTS idx_urls_user_id ON urls (user_id);
