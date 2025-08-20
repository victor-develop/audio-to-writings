# Supabase Storage Setup Guide

## Overview

This guide will help you set up Supabase Storage to handle audio file uploads for your Voice Recorder Pro application.

## Why Supabase Storage?

- **Persistent Storage**: Audio files persist across sessions and deployments
- **Scalable**: Handles large files and many users
- **Secure**: Row-level security policies ensure users only access their own files
- **CDN**: Files are served from a global CDN for fast access

## Setup Steps

### 1. Run the Storage Migration

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/20240101000001_create_storage_bucket.sql`
4. Click **Run**

**Note**: This only creates the storage bucket. The security policies need to be configured manually in the dashboard.

### 2. Configure Storage Policies

1. Go to **Storage** in your Supabase dashboard
2. Click on the `audio-recordings` bucket
3. Go to the **Policies** tab
4. Click **New Policy** and configure the following policies:

#### **INSERT Policy (Upload)**
- **Policy Name**: `Users can upload own audio files`
- **Target Roles**: `authenticated`
- **Using expression**: `bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]`

#### **SELECT Policy (View)**
- **Policy Name**: `Users can view own audio files`
- **Target Roles**: `authenticated`
- **Using expression**: `bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]`

#### **DELETE Policy (Delete)**
- **Policy Name**: `Users can delete own audio files`
- **Target Roles**: `authenticated`
- **Using expression**: `bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]`

### 3. Verify Storage Bucket Creation

1. Go to **Storage** in your Supabase dashboard
2. You should see an `audio-recordings` bucket
3. The bucket should be public (for file access)
4. Check that the policies are applied correctly

### 3. Test File Upload

1. Try recording and saving an audio file in your app
2. Check the **Storage** section to see if files are uploaded
3. Verify files are organized by user ID folders

## Storage Structure

```
audio-recordings/
├── user-id-1/
│   ├── recording_1_1234567890.webm
│   └── recording_2_1234567891.webm
└── user-id-2/
    └── recording_1_1234567892.webm
```

## Security Policies

- Users can only upload files to their own folder
- Users can only view files in their own folder
- Users can only delete files in their own folder
- File size limit: 50MB
- Allowed formats: webm, mp3, wav, ogg, m4a

## Troubleshooting

### Common Issues

1. **Upload Fails**
   - Check that the storage bucket exists
   - Verify RLS policies are applied
   - Check file size and format

2. **Files Not Accessible**
   - Ensure bucket is public
   - Check file permissions
   - Verify URL generation

3. **Storage Quota Exceeded**
   - Check your Supabase plan limits
   - Consider implementing file cleanup
   - Monitor storage usage

### Debug Commands

```sql
-- Check bucket exists
SELECT * FROM storage.buckets WHERE id = 'audio-recordings';

-- Check policies
SELECT * FROM storage.policies WHERE table_name = 'objects';

-- Check file uploads
SELECT * FROM storage.objects WHERE bucket_id = 'audio-recordings';
```

## Next Steps

After setting up storage:

1. **Test the complete flow**: Record → Save → Play → Download
2. **Monitor storage usage** in Supabase dashboard
3. **Implement file cleanup** for old recordings
4. **Add file compression** for better storage efficiency

## Support

If you encounter issues:

1. Check the Supabase logs in your dashboard
2. Verify all migrations have been applied
3. Test with a simple file upload first
4. Check the browser console for error messages
