-- Create user_prompts table for storing custom user prompts
CREATE TABLE IF NOT EXISTS public.user_prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    prompt TEXT NOT NULL,
    category TEXT DEFAULT 'custom',
    is_favorite BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_prompts_user_id ON public.user_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_prompts_category ON public.user_prompts(category);
CREATE INDEX IF NOT EXISTS idx_user_prompts_created_at ON public.user_prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_prompts_is_favorite ON public.user_prompts(is_favorite DESC);

-- Enable Row Level Security
ALTER TABLE public.user_prompts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own prompts
CREATE POLICY "Users can view own prompts" ON public.user_prompts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prompts" ON public.user_prompts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prompts" ON public.user_prompts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompts" ON public.user_prompts
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_user_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_prompts_updated_at
    BEFORE UPDATE ON public.user_prompts
    FOR EACH ROW
    EXECUTE FUNCTION update_user_prompts_updated_at();
