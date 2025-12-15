-- Create wishlists table
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can view their own wishlists
CREATE POLICY "Users can view their own wishlists"
    ON public.wishlists
    FOR SELECT
    USING (auth.uid()::text = user_id);

-- Create policy: Users can insert their own wishlists
CREATE POLICY "Users can insert their own wishlists"
    ON public.wishlists
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

-- Create policy: Users can update their own wishlists
CREATE POLICY "Users can update their own wishlists"
    ON public.wishlists
    FOR UPDATE
    USING (auth.uid()::text = user_id);

-- Create policy: Users can delete their own wishlists
CREATE POLICY "Users can delete their own wishlists"
    ON public.wishlists
    FOR DELETE
    USING (auth.uid()::text = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_wishlists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_wishlists_updated_at_trigger
    BEFORE UPDATE ON public.wishlists
    FOR EACH ROW
    EXECUTE FUNCTION public.update_wishlists_updated_at();
