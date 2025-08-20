-- Create storage bucket for audio recordings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-recordings',
  'audio-recordings',
  true,
  52428800, -- 50MB limit
  ARRAY['audio/webm', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a']
) ON CONFLICT (id) DO NOTHING;

-- Note: Storage policies are managed through the Supabase dashboard
-- Go to Storage > audio-recordings > Policies to configure:
-- 1. INSERT policy: Users can upload to their own folder
-- 2. SELECT policy: Users can view their own files  
-- 3. DELETE policy: Users can delete their own files
