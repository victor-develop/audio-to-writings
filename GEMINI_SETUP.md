# Gemini AI Integration Setup Guide

## Overview

This guide will help you set up Google Gemini AI integration for audio-to-writing conversion in your AudioPen Pro application.

## Prerequisites

- [Google AI Studio](https://aistudio.google.com/) account
- Gemini API key
- Supabase project with Edge Functions enabled

## Step 1: Get Gemini API Key

### 1.1 Access Google AI Studio
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click **Get API key** in the top right

### 1.2 Create API Key
1. Click **Create API key**
2. Choose **Create API key in new project** or select existing project
3. Copy the generated API key (starts with `AIza...`)
4. **Important**: Keep this key secure and don't share it publicly

## Step 2: Configure Supabase Edge Function

### 2.1 Set Environment Variables
In your Supabase dashboard:

1. Go to **Settings** → **Edge Functions**
2. Find the `gemini-transcribe` function
3. Add these environment variables:
   - `GEMINI_API_KEY`: Your Gemini API key
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anon key

### 2.2 Deploy the Function
```bash
# From your project directory
npx supabase functions deploy gemini-transcribe
```

## Step 3: Database Setup

### 3.1 Run Migration
1. Go to Supabase Dashboard → **SQL Editor**
2. Copy and paste the contents of:
   ```
   supabase/migrations/20240101000002_create_transcriptions_table.sql
   ```
3. Click **Run**

### 3.2 Verify Table Creation
1. Go to **Table Editor**
2. You should see a new `transcriptions` table
3. Check that RLS policies are applied

## Step 4: Test Integration

### 4.1 Local Testing
1. Start your development server: `npm run dev`
2. Record a short audio clip
3. Click the **Sparkles** button (AI Transcription)
4. Select a prompt and test transcription

### 4.2 Production Testing
1. Deploy to Vercel
2. Test the complete flow in production
3. Check Edge Function logs in Supabase

## API Usage & Limits

### Gemini API Limits
- **Free tier**: 15 requests per minute
- **Paid tier**: Higher limits available
- **File size**: Up to 10MB audio files
- **Supported formats**: MP3, WAV, M4A, WebM

### Cost Considerations
- **Free tier**: $0 for first 15 requests/minute
- **Paid tier**: $0.0005 per 1K characters
- **Audio processing**: Additional costs may apply

## Troubleshooting

### Common Issues

1. **API Key Not Found**
   - Verify `GEMINI_API_KEY` is set in Supabase
   - Check Edge Function environment variables

2. **Audio File Too Large**
   - Ensure audio files are under 10MB
   - Consider audio compression

3. **Transcription Fails**
   - Check Edge Function logs
   - Verify audio file format is supported
   - Check Gemini API quota

4. **CORS Errors**
   - Verify Edge Function CORS headers
   - Check function deployment status

### Debug Steps

1. **Check Edge Function Logs**
   - Supabase Dashboard → Edge Functions → Logs

2. **Verify API Key**
   - Test API key in Google AI Studio

3. **Check Audio File**
   - Verify file format and size
   - Test with different audio files

## Security Best Practices

### API Key Security
- ✅ Store in Supabase environment variables
- ✅ Never expose in client-side code
- ✅ Rotate keys regularly
- ❌ Don't commit to Git

### User Data Protection
- ✅ RLS policies ensure user isolation
- ✅ Audio files stored securely
- ✅ Transcriptions private to users

## Monitoring & Analytics

### Track Usage
- Monitor Edge Function invocations
- Track Gemini API usage
- Monitor transcription success rates

### Performance Metrics
- Response times
- File size processing
- Error rates

## Next Steps

After successful setup:

1. **Customize Prompts**: Add your own predefined prompts
2. **Optimize Audio**: Implement audio compression
3. **Add Features**: Batch processing, multiple formats
4. **Scale**: Consider caching and rate limiting

## Support Resources

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Google AI Studio](https://aistudio.google.com/)

## Environment Variables Summary

```bash
# Supabase Edge Function Environment Variables
GEMINI_API_KEY=AIza...your_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...your_anon_key_here
```

## Testing Checklist

- [ ] Gemini API key configured
- [ ] Edge Function deployed successfully
- [ ] Database migration completed
- [ ] Local transcription working
- [ ] Production deployment tested
- [ ] Error handling verified
- [ ] User isolation confirmed
