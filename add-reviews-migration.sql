-- ================================================================
-- Add Reviews Feature to MovieRank Database
-- ================================================================
-- Run this script if you already have an existing MovieRank database
-- and want to add the reviews feature
-- ================================================================

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL,
  rating REAL NOT NULL CHECK (rating >= 0 AND rating <= 10),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_movie_id ON reviews(movie_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Add comments
COMMENT ON TABLE reviews IS 'User reviews and ratings for movies';
COMMENT ON COLUMN reviews.rating IS 'User rating from 0-10';
COMMENT ON COLUMN reviews.comment IS 'Optional review text from user';

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Public read access for reviews" ON reviews;
CREATE POLICY "Public read access for reviews" 
ON reviews FOR SELECT 
TO public 
USING (true);

DROP POLICY IF EXISTS "Authenticated read access for reviews" ON reviews;
CREATE POLICY "Authenticated read access for reviews" 
ON reviews FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Users can insert their own reviews" ON reviews;
CREATE POLICY "Users can insert their own reviews" 
ON reviews FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
CREATE POLICY "Users can update their own reviews" 
ON reviews FOR UPDATE 
TO authenticated 
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;
CREATE POLICY "Users can delete their own reviews" 
ON reviews FOR DELETE 
TO authenticated 
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Service role full access to reviews" ON reviews;
CREATE POLICY "Service role full access to reviews" 
ON reviews FOR ALL 
TO service_role 
USING (true);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at 
    BEFORE UPDATE ON reviews 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add utility functions

-- Get movie statistics including user reviews
CREATE OR REPLACE FUNCTION get_movie_stats(movie_id_param INTEGER)
RETURNS TABLE (
  tmdb_rating REAL,
  tmdb_count INTEGER,
  user_rating REAL,
  user_count BIGINT,
  combined_rating REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.vote_average as tmdb_rating,
    m.vote_count as tmdb_count,
    COALESCE(AVG(r.rating), 0)::REAL as user_rating,
    COUNT(r.id) as user_count,
    CASE 
      WHEN COUNT(r.id) > 0 THEN 
        (m.vote_average * m.vote_count + AVG(r.rating) * COUNT(r.id)) / (m.vote_count + COUNT(r.id))
      ELSE 
        m.vote_average
    END::REAL as combined_rating
  FROM movies m
  LEFT JOIN reviews r ON r.movie_id = m.id
  WHERE m.id = movie_id_param
  GROUP BY m.id, m.vote_average, m.vote_count;
END;
$$ LANGUAGE plpgsql;

-- Get reviews for a movie with user information
CREATE OR REPLACE FUNCTION get_movie_reviews(movie_id_param INTEGER, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  user_id TEXT,
  user_name TEXT,
  user_email TEXT,
  rating REAL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.user_id,
    p.name as user_name,
    p.email as user_email,
    r.rating,
    r.comment,
    r.created_at,
    r.updated_at
  FROM reviews r
  JOIN profiles p ON p.id = r.user_id
  WHERE r.movie_id = movie_id_param
  ORDER BY r.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- Reviews feature added successfully!
-- ================================================================
