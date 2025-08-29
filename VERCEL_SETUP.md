# Vercel Site Access Control Setup

## Server-Side Protection Setup

To enable true server-side site access control, follow these steps:

### 1. Environment Variable Setup

In your Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add the following variable:
   - **Name**: `SITE_ACCESS_ENABLED`
   - **Value**: `true` (to enable) or `false` (to disable)
   - **Environment**: Production, Preview, Development

### 2. Deployment Protection (Alternative Method)

For even stronger protection, you can use Vercel's built-in deployment protection:

1. Go to your project settings in Vercel dashboard
2. Navigate to "Deployment Protection"
3. Enable "Vercel Authentication" for Production environment
4. Only team members with appropriate roles will be able to access the site

### 3. How It Works

- **Client-Side**: The React app checks site access via the `/api/site-access` endpoint
- **Server-Side**: The API endpoint reads from `SITE_ACCESS_ENABLED` environment variable
- **Cookie-Based**: Super admins get a `user-role=superadmin` cookie for identification

### 4. Testing

1. **Enable Access**: Set `SITE_ACCESS_ENABLED=true` → All users can access
2. **Disable Access**: Set `SITE_ACCESS_ENABLED=false` → Only super admins can access
3. **Super Admin**: Always has access via cookie identification

### 5. Production Workflow

1. Super admin logs into the dashboard
2. Goes to Settings tab
3. Toggles site access (this updates the runtime setting)
4. For persistent changes across deployments, update the environment variable in Vercel dashboard

### 6. Security Notes

- The API endpoint validates super admin role via headers/cookies
- Regular users will see a maintenance page when access is disabled
- Super admins can always access `/superadmin` route
- Environment variables provide server-side persistence

This approach combines client-side convenience with server-side security!
