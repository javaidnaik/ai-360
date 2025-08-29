# Deployment Guide

## Quick Start

1. **Get your Gemini API Key**
   - Visit [Google AI Studio](https://ai.google.dev/)
   - Create or sign in to your account
   - Generate an API key

2. **Deploy to Vercel (Recommended)**
   - Fork this repository
   - Connect to [Vercel](https://vercel.com)
   - Import your forked repository
   - Add environment variable: `GEMINI_API_KEY` with your API key
   - Deploy!

## Environment Variables

### Required
- `GEMINI_API_KEY`: Your Google Gemini API key

### Optional
- `NODE_ENV`: Set to `production` for production builds

## Post-Deployment

1. **Access your app**
   - Your app will be available at `https://your-app.vercel.app`

2. **Super Admin Access**
   - Navigate to `/superadmin`
   - Login with: admin@pixshop.com / admin123!
   - **Important**: Change the default admin password in production!

3. **User Management**
   - Users can sign up at `/auth`
   - All user data is stored locally in their browser
   - Super admins can view analytics and manage users

## Security Considerations

- Change the default JWT secret in production (currently hardcoded)
- Consider implementing password strength requirements
- Add rate limiting for API endpoints if needed
- The current setup uses client-side storage - consider server-side storage for production

## Troubleshooting

### Build Issues
- Make sure you have Node.js 16+ installed
- Run `npm install` to ensure all dependencies are installed
- Check that your API key is properly set

### Runtime Issues
- Verify your Gemini API key is valid
- Check browser console for any errors
- Ensure your browser supports IndexedDB

### Vercel Deployment Issues
- Verify environment variables are set correctly
- Check build logs for any errors
- Ensure `vercel.json` is present for proper routing

## Performance Optimization

The app includes several optimizations:
- Local IndexedDB storage for fast data access
- Efficient image processing with canvas
- Optimized bundle with Vite
- Proper cleanup of blob URLs to prevent memory leaks

For large-scale usage, consider:
- Implementing image compression before processing
- Adding pagination for video galleries
- Implementing proper error boundaries
- Adding loading states for better UX
