-- PIXSHOP DATABASE FIXES
-- Run this if you already have some tables created

-- Add missing columns to users table if they don't exist
DO $$ 
BEGIN
    -- Add first_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'first_name') THEN
        ALTER TABLE users ADD COLUMN first_name VARCHAR(255);
    END IF;
    
    -- Add last_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_name') THEN
        ALTER TABLE users ADD COLUMN last_name VARCHAR(255);
    END IF;
END $$;

-- Create password_reset_tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_settings table for Google Drive connections and other settings
CREATE TABLE IF NOT EXISTS user_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  google_drive_connected BOOLEAN DEFAULT FALSE,
  google_drive_token TEXT,
  google_drive_refresh_token TEXT,
  google_drive_folder_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Fix Row Level Security Policies
DO $$ 
BEGIN
    -- Password reset tokens table
    ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow all operations on password_reset_tokens" ON password_reset_tokens;
    CREATE POLICY "Allow all operations on password_reset_tokens" ON password_reset_tokens FOR ALL USING (true);
    
    -- User settings table
    ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow all operations on user_settings" ON user_settings;
    CREATE POLICY "Allow all operations on user_settings" ON user_settings FOR ALL USING (true);
END $$;

-- Update super admin with correct password and add names if missing
UPDATE users 
SET 
    password_hash = 'b80921595f7fd56db0acd8581d5abafeca181b5beadbe1f6be83477076d22ccd',
    first_name = COALESCE(first_name, 'Super'),
    last_name = COALESCE(last_name, 'Admin')
WHERE email = 'admin@pixshop.com';

-- Insert super admin if it doesn't exist
INSERT INTO users (email, password_hash, role, created_at, first_name, last_name) 
VALUES ('admin@pixshop.com', 'b80921595f7fd56db0acd8581d5abafeca181b5beadbe1f6be83477076d22ccd', 'super_admin', NOW(), 'Super', 'Admin')
ON CONFLICT (email) DO NOTHING;

-- Verify setup
SELECT 'Database fixes applied successfully!' as status;
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('users', 'videos', 'ai_models', 'password_reset_tokens', 'user_settings') 
    AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
