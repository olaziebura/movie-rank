-- Create wishlist_items junction table to store movies in each wishlist
CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
    movie_id INTEGER NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    UNIQUE(wishlist_id, movie_id)
);

-- Add index on wishlist_id for faster queries
CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist_id ON public.wishlist_items(wishlist_id);

-- Add index on movie_id for faster queries
CREATE INDEX IF NOT EXISTS idx_wishlist_items_movie_id ON public.wishlist_items(movie_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can view items in their own wishlists
CREATE POLICY "Users can view their own wishlist items"
    ON public.wishlist_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.wishlists
            WHERE wishlists.id = wishlist_items.wishlist_id
            AND wishlists.user_id = auth.uid()::text
        )
    );

-- Create policy: Users can insert items into their own wishlists
CREATE POLICY "Users can insert into their own wishlists"
    ON public.wishlist_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.wishlists
            WHERE wishlists.id = wishlist_items.wishlist_id
            AND wishlists.user_id = auth.uid()::text
        )
    );

-- Create policy: Users can update items in their own wishlists
CREATE POLICY "Users can update their own wishlist items"
    ON public.wishlist_items
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.wishlists
            WHERE wishlists.id = wishlist_items.wishlist_id
            AND wishlists.user_id = auth.uid()::text
        )
    );

-- Create policy: Users can delete items from their own wishlists
CREATE POLICY "Users can delete their own wishlist items"
    ON public.wishlist_items
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.wishlists
            WHERE wishlists.id = wishlist_items.wishlist_id
            AND wishlists.user_id = auth.uid()::text
        )
    );
