-- Add storage_path column to recordings table
ALTER TABLE public.recordings 
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Add index for storage_path for faster queries
CREATE INDEX IF NOT EXISTS idx_recordings_storage_path ON public.recordings(storage_path);

-- Update existing recordings to have a default storage_path if they don't have one
-- This extracts the filename from the audio_url using regexp_replace
UPDATE public.recordings 
SET storage_path = CASE 
  WHEN audio_url ~ '.*/' THEN 
    regexp_replace(audio_url, '^.*/([^/]+)$', '\1')
  ELSE audio_url
END
WHERE storage_path IS NULL;
