-- Pixshop Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
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

-- Users table policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text OR 
                   EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::integer AND role = 'super_admin'));

-- Super admins can view all users
CREATE POLICY "Super admins can view all users" ON users
  FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::integer AND role = 'super_admin'));

-- Allow user registration
CREATE POLICY "Allow user registration" ON users
  FOR INSERT WITH CHECK (true);

-- Users can update their own data
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text OR 
                   EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::integer AND role = 'super_admin'));

-- Super admins can delete users
CREATE POLICY "Super admins can delete users" ON users
  FOR DELETE USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::integer AND role = 'super_admin'));

-- Videos table policies
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Users can view their own videos
CREATE POLICY "Users can view own videos" ON videos
  FOR SELECT USING (user_id = auth.uid()::integer OR 
                   EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::integer AND role = 'super_admin'));

-- Users can insert their own videos
CREATE POLICY "Users can create own videos" ON videos
  FOR INSERT WITH CHECK (user_id = auth.uid()::integer OR 
                        EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::integer AND role = 'super_admin'));

-- Users can update their own videos
CREATE POLICY "Users can update own videos" ON videos
  FOR UPDATE USING (user_id = auth.uid()::integer OR 
                   EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::integer AND role = 'super_admin'));

-- Users can delete their own videos
CREATE POLICY "Users can delete own videos" ON videos
  FOR DELETE USING (user_id = auth.uid()::integer OR 
                   EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::integer AND role = 'super_admin'));

-- AI Models table policies
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage AI models
CREATE POLICY "Super admins can manage AI models" ON ai_models
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::integer AND role = 'super_admin'));

-- Everyone can read active AI models
CREATE POLICY "Everyone can read active AI models" ON ai_models
  FOR SELECT USING (is_active = true);

-- Insert default super admin
INSERT INTO users (email, password_hash, role, created_at) 
VALUES ('admin@pixshop.com', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'super_admin', NOW())
ON CONFLICT (email) DO NOTHING;

-- Note: The password hash above is for an empty string. 
-- You should update it with the proper hash for 'admin123!' after running this script.
-- Run this to update the password:
-- UPDATE users SET password_hash = 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d' WHERE email = 'admin@pixshop.com';
