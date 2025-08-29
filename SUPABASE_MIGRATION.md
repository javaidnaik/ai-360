# Supabase Migration Guide

This guide will help you migrate from IndexedDB to Supabase for a more reliable, cloud-based database solution.

## Why Migrate to Supabase?

- **Reliability**: No more IndexedDB errors in different browsers
- **Scalability**: PostgreSQL database that can handle millions of records
- **Free Tier**: 500MB storage, unlimited API requests
- **Real-time**: Built-in real-time capabilities
- **Security**: Row-level security policies built-in

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up/Login with GitHub
4. Click "New Project"
5. Choose your organization
6. Fill in project details:
   - **Name**: pixshop-db (or your preferred name)
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
7. Click "Create new project"

## Step 2: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`) - **NOT** the PostgreSQL URL!
   - **anon public key** (starts with `eyJ...`)

⚠️ **IMPORTANT**: Use the "Project URL" that looks like `https://xxxxx.supabase.co`, NOT the PostgreSQL connection string that starts with `postgres://`. The PostgreSQL URL is for server-side connections only.

## Step 3: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the contents of `supabase-schema.sql` from this project
4. Click "Run" to execute the SQL
5. Verify the tables were created in **Table Editor**

## Step 4: Configure Environment Variables

1. Copy your `.env.local` file or create one from `env.example`
2. Add your Supabase credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Common Mistake**: Don't use the PostgreSQL URL (`postgres://...`). Use the Project URL that starts with `https://`.

## Step 5: Update Super Admin Password

The schema creates a default super admin with an empty password. Update it:

1. In Supabase SQL Editor, run:

```sql
-- Update super admin password to 'admin123!'
UPDATE users 
SET password_hash = 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d' 
WHERE email = 'admin@pixshop.com';
```

## Step 6: Deploy to Vercel

1. Push your changes to GitHub
2. In Vercel dashboard, go to your project settings
3. Add the environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Redeploy your application

## Step 7: Test the Migration

1. Try logging in with:
   - **Email**: admin@pixshop.com
   - **Password**: admin123!
2. Create a new user account
3. Generate a 360° video
4. Check that data persists across browser sessions

## Troubleshooting

### "Request cannot be constructed from a URL that includes credentials"
**This is the most common error!** You're using the wrong URL.

❌ **Wrong**: `postgres://postgres.xyz:password@aws-1-us-east-1.pooler.supabase.com:6543/postgres`  
✅ **Correct**: `https://xyz.supabase.co`

**Fix**: 
1. Go to Supabase Dashboard → Settings → API
2. Copy the **Project URL** (not Connection string)
3. It should look like: `https://your-project-id.supabase.co`

### "Failed to connect to Supabase"
- Verify your `VITE_SUPABASE_URL` starts with `https://` 
- Verify your `VITE_SUPABASE_ANON_KEY` starts with `eyJ`
- Make sure the environment variables are set correctly in `.env.local`

### "Row Level Security policy violation"
- The RLS policies are set up to allow proper access
- Make sure you ran the complete schema from `supabase-schema.sql`

### "Super admin login not working"
- Make sure you updated the password hash as shown in Step 5
- Verify the user exists in the `users` table

## Benefits After Migration

✅ **No more IndexedDB errors**  
✅ **Data persists across devices**  
✅ **Better performance and reliability**  
✅ **Real-time capabilities for future features**  
✅ **Professional database with backups**  
✅ **Row-level security for data protection**

## Data Migration (Optional)

If you have existing data in IndexedDB that you want to migrate:

1. Export data from IndexedDB using browser dev tools
2. Format the data to match Supabase schema
3. Use Supabase's import tools or SQL INSERT statements

The app will work immediately with Supabase - no existing data migration is required for basic functionality.
