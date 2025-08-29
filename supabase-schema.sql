-- Pixshop Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  prompt TEXT NOT NULL,
  animation_style VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  drive_file_id VARCHAR(255),
  drive_view_link TEXT,
  drive_download_link TEXT,
  is_stored_in_drive BOOLEAN DEFAULT FALSE
);

-- Create ai_models table
CREATE TABLE IF NOT EXISTS ai_models (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  model_id VARCHAR(255) NOT NULL,
  api_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_timestamp ON videos(timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_models_active ON ai_models(is_active);

-- Row Level Security Policies
-- Note: Since we're using custom authentication (not Supabase Auth), 
-- we'll disable RLS for now and rely on application-level security

-- Users table - Allow all operations for custom auth
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);

-- Videos table - Allow all operations for custom auth  
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on videos" ON videos FOR ALL USING (true);

-- AI Models table - Allow all operations for custom auth
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on ai_models" ON ai_models FOR ALL USING (true);

-- Insert default super admin
INSERT INTO users (email, password_hash, role, created_at) 
VALUES ('admin@pixshop.com', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'super_admin', NOW())
ON CONFLICT (email) DO NOTHING;

-- Note: The password hash above is for an empty string. 
-- You should update it with the proper hash for 'admin123!' after running this script.
-- Run this to update the password:
-- UPDATE users SET password_hash = 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d' WHERE email = 'admin@pixshop.com';
