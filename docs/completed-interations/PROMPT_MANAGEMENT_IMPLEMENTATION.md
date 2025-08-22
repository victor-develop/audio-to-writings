# 🚀 Prompt Management Implementation Guide

## 📋 Overview

This implementation adds comprehensive prompt management capabilities to your AI transcription app:

- **Collapsible prompts** - Long prompts are collapsed by default with expand/collapse functionality
- **Custom prompt creation** - Users can create their own prompts on-the-fly
- **Auto-save with auto-naming** - Custom prompts are automatically saved with intelligent names
- **Prompt management** - Edit, delete, favorite, and organize custom prompts
- **Supabase storage** - All prompt data is stored securely in your database

## 🗄️ Database Changes

### New Table: `user_prompts`

The implementation creates a new table to store user custom prompts:

```sql
-- Table structure
CREATE TABLE public.user_prompts (
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
```

**Features:**
- **User isolation** - Each user only sees their own prompts
- **Categories** - Organize prompts by type (LinkedIn, Business, etc.)
- **Favorites** - Mark frequently used prompts as favorites
- **Usage tracking** - Count how many times each prompt is used
- **Timestamps** - Track creation and last update times

## 🔧 Supabase Migration Steps

### Step 1: Run the Migration

1. **Open your Supabase dashboard**
2. **Go to SQL Editor**
3. **Run the migration file**: `supabase/migrations/20240101000004_create_user_prompts_table.sql`

```bash
# Or run this SQL directly in the SQL Editor:
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_prompts_user_id ON public.user_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_prompts_category ON public.user_prompts(category);
CREATE INDEX IF NOT EXISTS idx_user_prompts_created_at ON public.user_prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_prompts_is_favorite ON public.user_prompts(is_favorite DESC);

-- Enable Row Level Security
ALTER TABLE public.user_prompts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own prompts" ON public.user_prompts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prompts" ON public.user_prompts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prompts" ON public.user_prompts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompts" ON public.user_prompts
    FOR DELETE USING (auth.uid() = user_id);

-- Create function and trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_prompts_updated_at
    BEFORE UPDATE ON public.user_prompts
    FOR EACH ROW
    EXECUTE FUNCTION update_user_prompts_updated_at();
```

### Step 2: Verify the Migration

After running the migration, verify it was successful:

```sql
-- Check if table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'user_prompts';

-- Check table structure
\d public.user_prompts

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_prompts' AND schemaname = 'public';

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'user_prompts';
```

## 🎯 New Features

### 1. Collapsible Prompts
- **Built-in prompts** are collapsed by default
- **Click the chevron** to expand and see full prompt text
- **Scrollable content** for very long prompts
- **Visual indicators** for selected prompts

### 2. Custom Prompt Creation
- **"Create New" button** in the prompt selection area
- **Auto-naming** - Intelligently generates names from prompt content
- **Category selection** - Organize prompts by type
- **Instant saving** - Prompts are saved immediately to Supabase

### 3. Prompt Management
- **Edit prompts** - Modify name, content, and category
- **Delete prompts** - Remove unwanted prompts
- **Favorite system** - Mark important prompts as favorites
- **Usage tracking** - See how many times each prompt was used

### 4. Enhanced UX
- **Separate sections** for built-in vs. custom prompts
- **Visual feedback** for selected prompts
- **Action buttons** for prompt management
- **Responsive design** - Works on all screen sizes

## 🔐 Security Features

### Row Level Security (RLS)
- **User isolation** - Users can only access their own prompts
- **Automatic filtering** - Queries automatically filter by user ID
- **Policy enforcement** - Database-level security

### Data Validation
- **Input sanitization** - Prevents malicious input
- **Required fields** - Name and prompt text are mandatory
- **Length limits** - Prevents extremely long prompts

## 📱 User Experience Flow

### Creating a Custom Prompt
1. **Click "Create New"** in the prompt selection area
2. **Enter prompt name** (or use auto-generated name)
3. **Select category** (optional)
4. **Write prompt text**
5. **Click "Save Prompt"**
6. **Prompt appears** in "Your Custom Prompts" section

### Using a Custom Prompt
1. **Select your custom prompt** from the list
2. **Click "Start AI Writing"**
3. **Usage count increments** automatically
4. **Prompt is used** for transcription

### Managing Prompts
1. **Edit**: Click the edit icon on any custom prompt
2. **Delete**: Click the delete icon to remove prompts
3. **Favorite**: Click the star icon to toggle favorite status
4. **Expand**: Click the chevron to see full prompt text

## 🚀 Deployment

### 1. Run Migration
```bash
# In Supabase dashboard SQL Editor
# Run the migration file: 20240101000004_create_user_prompts_table.sql
```

### 2. Deploy Code
```bash
# Build and deploy your updated app
npm run build
# Deploy to your hosting platform
```

### 3. Test Features
- Create a custom prompt
- Use it for transcription
- Edit the prompt
- Mark as favorite
- Delete the prompt

## 🔍 Troubleshooting

### Common Issues

#### Migration Fails
```sql
-- Check if table already exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'user_prompts';

-- Drop and recreate if needed
DROP TABLE IF EXISTS public.user_prompts CASCADE;
-- Then run the migration again
```

#### RLS Policies Not Working
```sql
-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_prompts';

-- Check policies exist
SELECT * FROM pg_policies WHERE tablename = 'user_prompts';
```

#### User Can't See Prompts
- **Check authentication** - User must be logged in
- **Verify user ID** - Check if auth.uid() is working
- **Test RLS policies** - Run a test query with user context

### Debug Queries

```sql
-- Check user prompts for a specific user
SELECT * FROM public.user_prompts WHERE user_id = 'your-user-id';

-- Test RLS with authenticated user
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO 'your-user-id';
SELECT * FROM public.user_prompts;
RESET ROLE;
```

## 📊 Performance Considerations

### Indexes
- **User ID index** - Fast user-specific queries
- **Category index** - Efficient category filtering
- **Created date index** - Fast chronological sorting
- **Favorite index** - Quick favorite status queries

### Query Optimization
- **Selective loading** - Only load user's own prompts
- **Lazy expansion** - Prompt content only loads when expanded
- **Efficient updates** - Minimal database writes

## 🔮 Future Enhancements

### Potential Improvements
- **Prompt templates** - Reusable prompt structures
- **Prompt sharing** - Share prompts between users
- **Prompt analytics** - Usage statistics and insights
- **Prompt versioning** - Track changes over time
- **Prompt search** - Find prompts by content or tags

### Scalability
- **Pagination** - Handle large numbers of prompts
- **Caching** - Cache frequently used prompts
- **Batch operations** - Bulk prompt management

## ✅ Success Checklist

After implementation, verify:

- [ ] Migration runs successfully
- [ ] Table structure is correct
- [ ] RLS policies are active
- [ ] Custom prompts can be created
- [ ] Prompts are saved to database
- [ ] Prompts can be edited/deleted
- [ ] Favorite system works
- [ ] Usage tracking increments
- [ ] Built-in prompts still work
- [ ] UI is responsive and intuitive

---

**🎉 Congratulations!** Your app now has a powerful, user-friendly prompt management system that enhances the transcription experience while maintaining security and performance.
