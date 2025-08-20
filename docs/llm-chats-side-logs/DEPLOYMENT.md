# Deployment Guide - Voice Recorder Pro

This guide will walk you through deploying your Voice Recorder Pro application to production.

## Prerequisites

- [Supabase](https://supabase.com) account
- [Vercel](https://vercel.com) account
- [Google Cloud Console](https://console.cloud.google.com) account (for OAuth)
- Git repository with your code

## Step 1: Set Up Supabase Backend

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `voice-recorder-app` (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Select the region closest to your users
5. Click "Create new project"
6. Wait for the project to be created (this may take a few minutes)

### 1.2 Get Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)

### 1.3 Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Configure the OAuth consent screen if prompted
6. Choose **Web application** as the application type
7. Add authorized redirect URIs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `http://localhost:3000/dashboard` (for local development)
8. Copy the **Client ID** and **Client Secret**

### 1.4 Configure Supabase Authentication

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click **Edit**
3. Enable Google provider
4. Paste your Google OAuth credentials:
   - **Client ID**: Your Google OAuth client ID
   - **Client Secret**: Your Google OAuth client secret
5. Click **Save**

### 1.5 Set Up Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy and paste the contents of `supabase/migrations/20240101000000_create_recordings_table.sql`
3. Click **Run** to execute the migration
4. Copy and paste the contents of `supabase/migrations/20240101000001_create_storage_bucket.sql`
5. Click **Run** to execute the storage migration
6. **Important**: Configure storage policies manually in the dashboard (see STORAGE_SETUP.md)

### 1.6 Deploy Edge Functions

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Deploy the transcribe function:
   ```bash
   supabase functions deploy transcribe
   ```

5. Set environment variables for the function:
   ```bash
   supabase secrets set SUPABASE_URL=https://your-project.supabase.co
   supabase secrets set SUPABASE_ANON_KEY=your-anon-key
   ```

## Step 2: Deploy Frontend to Vercel

### 2.1 Prepare Your Repository

1. Make sure your code is committed to a Git repository
2. Ensure you have a `.env.local` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### 2.2 Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **New Project**
3. Import your Git repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (or leave empty)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**

### 2.3 Configure Environment Variables

1. In your Vercel project dashboard, go to **Settings** → **Environment Variables**
2. Add the following variables:
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: `https://your-project.supabase.co`
   - **Environment**: Production (and Preview if you want)
3. Add the second variable:
   - **Name**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: Your Supabase anon key (starts with `eyJ...`)
   - **Environment**: Production (and Preview if you want)
4. Click **Save** for each variable
5. **Important**: After adding environment variables, you need to redeploy your project for them to take effect

### 2.4 Update Supabase Redirect URLs

1. Go back to your Supabase dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Update the **Site URL** to your Vercel domain: `https://your-app.vercel.app`
4. Add your Vercel domain to **Redirect URLs**: `https://your-app.vercel.app/dashboard`
5. Click **Save**

## Step 3: Test Your Deployment

### 3.1 Test Authentication

1. Visit your Vercel app URL
2. Try to sign in with Google
3. Verify you're redirected to the dashboard after authentication

### 3.2 Test Recording Features

1. Test the recording functionality
2. Verify recordings are saved locally
3. Test the audio playback

### 3.3 Test Edge Functions

1. Check the Supabase dashboard for any function errors
2. Verify the transcribe function is accessible

## Step 4: Production Considerations

### 4.1 Security

- Ensure all environment variables are properly set
- Review Supabase Row Level Security policies
- Consider implementing rate limiting for Edge Functions

### 4.2 Performance

- Enable Vercel's Edge Network for global distribution
- Consider implementing caching strategies
- Monitor Supabase performance metrics

### 4.3 Monitoring

- Set up Vercel analytics
- Monitor Supabase logs and performance
- Set up error tracking (e.g., Sentry)

## Troubleshooting

### Common Issues

1. **OAuth Redirect Errors**
   - Verify redirect URLs are correctly configured in both Google and Supabase
   - Check that the site URL matches exactly

2. **Environment Variables Not Working**
   - Ensure variables are prefixed with `VITE_` for Vite
   - Redeploy after adding environment variables

3. **Edge Function Errors**
   - Check Supabase function logs
   - Verify environment variables are set correctly

4. **Build Failures**
   - Check that all dependencies are installed
   - Verify TypeScript compilation passes locally

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev/guide/)

### Common Vercel Deployment Issues

1. **Environment Variables Not Working**
   - Ensure variables are prefixed with `VITE_` for Vite
   - Redeploy after adding environment variables
   - Check that variables are set for the correct environment (Production/Preview)

2. **Build Failures**
   - Verify all dependencies are in `package.json`
   - Check that TypeScript compilation passes locally
   - Ensure `npm run build` works locally

3. **OAuth Redirect Errors**
   - Verify redirect URLs match exactly (including protocol and trailing slashes)
   - Check that environment variables are loaded correctly
   - Ensure Supabase project is properly configured

## Next Steps

After successful deployment, consider:

1. **Custom Domain**: Set up a custom domain in Vercel
2. **Analytics**: Implement user analytics and monitoring
3. **CI/CD**: Set up automatic deployments on Git pushes
4. **Backup**: Implement database backup strategies
5. **Scaling**: Plan for user growth and scaling strategies

## Support

If you encounter issues during deployment:

1. Check the troubleshooting section above
2. Review the logs in both Vercel and Supabase dashboards
3. Open an issue in your project repository
4. Contact Supabase or Vercel support if needed
