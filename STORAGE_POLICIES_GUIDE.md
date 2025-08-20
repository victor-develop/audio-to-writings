# Supabase Storage Policies Setup Guide

## Step-by-Step Dashboard Configuration

Since the SQL migration can't create storage policies due to ownership restrictions, you need to configure them manually in the Supabase dashboard.

### Step 1: Access Storage Policies

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Storage** in the left sidebar
4. Click on the `audio-recordings` bucket
5. Click the **Policies** tab

### Step 2: Create INSERT Policy

1. Click **New Policy**
2. Choose **Create a policy from scratch**
3. Fill in the details:
   - **Policy Name**: `Users can upload own audio files`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `authenticated`
   - **Policy definition**: `bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]`
4. Click **Review** then **Save policy**

### Step 3: Create SELECT Policy

1. Click **New Policy** again
2. Choose **Create a policy from scratch**
3. Fill in the details:
   - **Policy Name**: `Users can view own audio files`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `authenticated`
   - **Policy definition**: `bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]`
4. Click **Review** then **Save policy**

### Step 4: Create DELETE Policy

1. Click **New Policy** again
2. Choose **Create a policy from scratch**
3. Fill in the details:
   - **Policy Name**: `Users can delete own audio files`
   - **Allowed operation**: `DELETE`
   - **Target roles**: `authenticated`
   - **Policy definition**: `bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]`
4. Click **Review** then **Save policy**

## Policy Explanation

The policy expression `bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]` ensures:

- **`bucket_id = 'audio-recordings'`**: Only applies to our audio bucket
- **`auth.uid()::text = (storage.foldername(name))[1]`**: User can only access files in their own folder

### File Structure
```
audio-recordings/
├── user-uuid-1/          ← First folder level = user ID
│   ├── recording1.webm
│   └── recording2.webm
└── user-uuid-2/          ← First folder level = user ID
    └── recording1.webm
```

## Verification

After creating all policies:

1. Go to **Storage** → **audio-recordings** → **Policies**
2. You should see 3 policies listed
3. Each policy should show the correct operation and expression
4. Test by trying to upload a file as an authenticated user

## Troubleshooting

### Common Issues

1. **Policy not working**: Check that the expression syntax is exactly correct
2. **Upload fails**: Verify the INSERT policy exists and is enabled
3. **Can't view files**: Check the SELECT policy configuration
4. **Delete fails**: Ensure the DELETE policy is properly set up

### Testing

1. **Test Upload**: Try recording and saving an audio file
2. **Test View**: Try playing a saved recording
3. **Test Delete**: Try deleting a recording
4. **Check Logs**: Look at the browser console for any errors

## Security Notes

- **Public bucket**: Files are publicly accessible via URL (required for audio playback)
- **User isolation**: Policies ensure users can only access their own files
- **Authentication required**: All operations require user authentication
- **Folder-based access**: Users can only access files in their own folder

## Next Steps

After policies are configured:

1. Test the complete recording flow
2. Deploy to Vercel
3. Verify everything works in production
4. Monitor storage usage and access logs
