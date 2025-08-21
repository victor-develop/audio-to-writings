-- Fix critical storage security issues
-- Make the bucket private and add proper RLS policies

-- First, make the bucket private (this will break existing public URLs)
UPDATE storage.buckets 
SET public = false 
WHERE id = 'audio-recordings';

-- Enable Row Level Security on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access files in their own folder
CREATE POLICY "Users can access own audio files" ON storage.objects
    FOR ALL USING (
        bucket_id = 'audio-recordings' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy: Users can upload to their own folder
CREATE POLICY "Users can upload to own folder" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'audio-recordings' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy: Users can update their own files
CREATE POLICY "Users can update own audio files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'audio-recordings' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own audio files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'audio-recordings' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Note: After this migration, you'll need to update your frontend code
-- to use signed URLs instead of public URLs for file access
