-- Create recordings table
CREATE TABLE IF NOT EXISTS public.recordings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    duration INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_recordings_user_id ON public.recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_recordings_created_at ON public.recordings(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own recordings
CREATE POLICY "Users can view own recordings" ON public.recordings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recordings" ON public.recordings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recordings" ON public.recordings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recordings" ON public.recordings
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_recordings_updated_at
    BEFORE UPDATE ON public.recordings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
