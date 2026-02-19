-- Settings V1.2 Migration (Fixed)

-- 1. Social Handles & Budget for Members
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS instagram_handle text,
ADD COLUMN IF NOT EXISTS linkedin_url text,
ADD COLUMN IF NOT EXISTS facebook_url text,
ADD COLUMN IF NOT EXISTS budget_tier text; -- Single string for budget

-- 2. Schedule Notes for Members
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS schedule_notes text;

-- 3. Kids Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.kids (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- Direct auth reference
    name text NOT NULL,
    birth_year integer,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS for Kids
ALTER TABLE public.kids ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own kids
DO $$ BEGIN
    CREATE POLICY "Users can view own kids" ON public.kids FOR SELECT USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Policy: Users can insert their own kids
DO $$ BEGIN
    CREATE POLICY "Users can insert own kids" ON public.kids FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Policy: Users can update their own kids
DO $$ BEGIN
    CREATE POLICY "Users can update own kids" ON public.kids FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Policy: Users can delete their own kids
DO $$ BEGIN
    CREATE POLICY "Users can delete own kids" ON public.kids FOR DELETE USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Realtime
alter publication supabase_realtime add table public.kids;
