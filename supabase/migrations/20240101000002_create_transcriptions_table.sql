-- Create transcriptions table
CREATE TABLE IF NOT EXISTS public.transcriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recording_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    prompt TEXT NOT NULL,
    transcription TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_transcriptions_user_id ON public.transcriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_recording_id ON public.transcriptions(recording_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at ON public.transcriptions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own transcriptions
CREATE POLICY "Users can view own transcriptions" ON public.transcriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transcriptions" ON public.transcriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transcriptions" ON public.transcriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transcriptions" ON public.transcriptions
    FOR DELETE USING (auth.uid() = user_id);
