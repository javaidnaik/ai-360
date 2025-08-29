-- QUICK FIX: Update super admin password hash
-- Run this in Supabase SQL Editor to fix the password hash

UPDATE users 
SET password_hash = 'b80921595f7fd56db0acd8581d5abafeca181b5beadbe1f6be83477076d22ccd'
WHERE email = 'admin@pixshop.com';

-- Verify the update
SELECT email, password_hash, role, first_name, last_name 
FROM users 
WHERE email = 'admin@pixshop.com';
