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
    
    -- Add approval status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'approval_status') THEN
        ALTER TABLE users ADD COLUMN approval_status VARCHAR(20) DEFAULT 'pending';
    END IF;
    
    -- Add approved_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'approved_by') THEN
        ALTER TABLE users ADD COLUMN approved_by INTEGER REFERENCES users(id);
    END IF;
    
    -- Add approved_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'approved_at') THEN
        ALTER TABLE users ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
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

-- Create maintenance_settings table for site-wide maintenance mode
CREATE TABLE IF NOT EXISTS maintenance_settings (
  id SERIAL PRIMARY KEY,
  is_maintenance_mode BOOLEAN DEFAULT FALSE,
  maintenance_message TEXT DEFAULT 'We are currently performing scheduled maintenance. Please check back soon.',
  maintenance_title VARCHAR(255) DEFAULT 'Site Under Maintenance',
  estimated_completion TIMESTAMP WITH TIME ZONE,
  enabled_by INTEGER REFERENCES users(id),
  enabled_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_settings_is_maintenance_mode ON maintenance_settings(is_maintenance_mode);

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
    
    -- Maintenance settings table
    ALTER TABLE maintenance_settings ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow all operations on maintenance_settings" ON maintenance_settings;
    CREATE POLICY "Allow all operations on maintenance_settings" ON maintenance_settings FOR ALL USING (true);
END $$;

-- Update existing super admin with correct password and add names if missing
UPDATE users 
SET 
    password_hash = 'b80921595f7fd56db0acd8581d5abafeca181b5beadbe1f6be83477076d22ccd',
    first_name = COALESCE(first_name, 'Super'),
    last_name = COALESCE(last_name, 'Admin'),
    approval_status = 'approved',
    approved_at = COALESCE(approved_at, NOW())
WHERE email = 'admin@pixshop.com';

-- Insert default super admin if it doesn't exist
-- Create new super admin for Javaid
-- Password: 123456 -> SHA256('123456your-secret-key-here-make-it-long-and-random-for-production')
INSERT INTO users (email, password_hash, role, created_at, first_name, last_name, approval_status, approved_at) 
VALUES ('hi@javaid.in', '8d0a92350d5e3afb1e5f164f8b396a1a792e07fd7e9f0530f5b445c11140b720', 'super_admin', NOW(), 'Javaid', 'Naik', 'approved', NOW())
ON CONFLICT (email) DO NOTHING;

-- Approve all existing super admins (in case any were missed)
UPDATE users 
SET 
    approval_status = 'approved',
    approved_at = COALESCE(approved_at, NOW())
WHERE role = 'super_admin' AND approval_status != 'approved';

-- Fix animation_style column to allow NULL values if it exists
DO $$ 
BEGIN
    -- Check if animation_style column exists and make it nullable
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'animation_style') THEN
        ALTER TABLE videos ALTER COLUMN animation_style DROP NOT NULL;
    END IF;
END $$;

-- Initialize maintenance settings (disabled by default)
INSERT INTO maintenance_settings (is_maintenance_mode, maintenance_message, maintenance_title) 
VALUES (FALSE, 'We are currently performing scheduled maintenance. Please check back soon.', 'Site Under Maintenance')
ON CONFLICT DO NOTHING;

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
