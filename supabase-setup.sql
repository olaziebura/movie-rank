-- ================================================================
-- MovieRank - Complete Supabase Database Setup
-- ================================================================
-- This script creates all necessary tables, indexes, policies, and functions
-- Run this script in your Supabase SQL Editor to set up the database
-- ================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- TABLE: profiles
-- ================================================================
-- Stores user profile information
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  profile_image_url TEXT,
  wishlist INTEGER[] DEFAULT '{}',
  admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_admin ON profiles(admin);

-- Comments for profiles table
COMMENT ON TABLE profiles IS 'User profile information';
COMMENT ON COLUMN profiles.id IS 'Auth0 user ID';
COMMENT ON COLUMN profiles.wishlist IS 'Array of movie IDs in user wishlist';
COMMENT ON COLUMN profiles.profile_image_url IS 'URL or path to user profile image';

-- ================================================================
-- TABLE: movies
-- ================================================================
-- Stores cached movie data from TMDB API
CREATE TABLE IF NOT EXISTS movies (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  overview TEXT,
  release_date DATE,
  poster_path TEXT,
  backdrop_path TEXT,
  vote_average REAL DEFAULT 0,
  vote_count INTEGER DEFAULT 0,
  popularity REAL DEFAULT 0,
  genre_ids INTEGER[],
  category TEXT,
  adult BOOLEAN DEFAULT false,
  original_language TEXT,
  original_title TEXT,
  video BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for movies table
CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
CREATE INDEX IF NOT EXISTS idx_movies_release_date ON movies(release_date);
CREATE INDEX IF NOT EXISTS idx_movies_category ON movies(category);
CREATE INDEX IF NOT EXISTS idx_movies_popularity ON movies(popularity DESC);
CREATE INDEX IF NOT EXISTS idx_movies_vote_average ON movies(vote_average DESC);
CREATE INDEX IF NOT EXISTS idx_movies_genre_ids ON movies USING GIN (genre_ids);
CREATE INDEX IF NOT EXISTS idx_movies_updated_at ON movies(updated_at);

-- Constraints for movies table
ALTER TABLE movies DROP CONSTRAINT IF EXISTS check_vote_average;
ALTER TABLE movies ADD CONSTRAINT check_vote_average 
  CHECK (vote_average >= 0 AND vote_average <= 10);

ALTER TABLE movies DROP CONSTRAINT IF EXISTS check_vote_count;
ALTER TABLE movies ADD CONSTRAINT check_vote_count 
  CHECK (vote_count >= 0);

ALTER TABLE movies DROP CONSTRAINT IF EXISTS check_popularity;
ALTER TABLE movies ADD CONSTRAINT check_popularity 
  CHECK (popularity >= 0);

-- Comments for movies table
COMMENT ON TABLE movies IS 'Cached movie data from TMDB API';
COMMENT ON COLUMN movies.id IS 'TMDB movie ID (primary key)';
COMMENT ON COLUMN movies.category IS 'TMDB category: popular, top_rated, now_playing, upcoming';
COMMENT ON COLUMN movies.genre_ids IS 'Array of TMDB genre IDs';

-- ================================================================
-- TABLE: upcoming_movies_featured
-- ================================================================
-- Stores curated list of featured upcoming movies
CREATE TABLE IF NOT EXISTS upcoming_movies_featured (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  overview TEXT,
  release_date DATE,
  poster_path TEXT,
  backdrop_path TEXT,
  vote_average REAL DEFAULT 0,
  vote_count INTEGER DEFAULT 0,
  popularity REAL DEFAULT 0,
  genre_ids INTEGER[],
  worth_waiting_score REAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for upcoming_movies_featured table
CREATE INDEX IF NOT EXISTS idx_upcoming_featured_release_date ON upcoming_movies_featured(release_date);
CREATE INDEX IF NOT EXISTS idx_upcoming_featured_popularity ON upcoming_movies_featured(popularity DESC);
CREATE INDEX IF NOT EXISTS idx_upcoming_featured_score ON upcoming_movies_featured(worth_waiting_score DESC);
CREATE INDEX IF NOT EXISTS idx_upcoming_featured_genre_ids ON upcoming_movies_featured USING GIN (genre_ids);

-- Constraints for upcoming_movies_featured table
ALTER TABLE upcoming_movies_featured DROP CONSTRAINT IF EXISTS check_upcoming_vote_average;
ALTER TABLE upcoming_movies_featured ADD CONSTRAINT check_upcoming_vote_average 
  CHECK (vote_average >= 0 AND vote_average <= 10);

ALTER TABLE upcoming_movies_featured DROP CONSTRAINT IF EXISTS check_upcoming_vote_count;
ALTER TABLE upcoming_movies_featured ADD CONSTRAINT check_upcoming_vote_count 
  CHECK (vote_count >= 0);

-- Comments for upcoming_movies_featured table
COMMENT ON TABLE upcoming_movies_featured IS 'Curated list of top upcoming movies worth waiting for';
COMMENT ON COLUMN upcoming_movies_featured.worth_waiting_score IS 'AI-calculated score for how worth waiting this movie is';

-- ================================================================
-- TABLE: reviews
-- ================================================================
-- Stores user reviews and ratings for movies
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

-- Indexes for reviews table
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_movie_id ON reviews(movie_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Comments for reviews table
COMMENT ON TABLE reviews IS 'User reviews and ratings for movies';
COMMENT ON COLUMN reviews.rating IS 'User rating from 0-10';
COMMENT ON COLUMN reviews.comment IS 'Optional review text from user';

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE upcoming_movies_featured ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
TO authenticated 
USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
TO authenticated 
USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Service role full access to profiles" ON profiles;
CREATE POLICY "Service role full access to profiles" 
ON profiles FOR ALL 
TO service_role 
USING (true);

-- Movies policies  
DROP POLICY IF EXISTS "Public read access for movies" ON movies;
CREATE POLICY "Public read access for movies" 
ON movies FOR SELECT 
TO public 
USING (true);

DROP POLICY IF EXISTS "Authenticated users can read movies" ON movies;
CREATE POLICY "Authenticated users can read movies" 
ON movies FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Service role full access to movies" ON movies;
CREATE POLICY "Service role full access to movies" 
ON movies FOR ALL 
TO service_role 
USING (true);

-- Upcoming movies featured policies
DROP POLICY IF EXISTS "Public read access for upcoming movies" ON upcoming_movies_featured;
CREATE POLICY "Public read access for upcoming movies" 
ON upcoming_movies_featured FOR SELECT 
TO public 
USING (true);

DROP POLICY IF EXISTS "Authenticated read access for upcoming movies" ON upcoming_movies_featured;
CREATE POLICY "Authenticated read access for upcoming movies" 
ON upcoming_movies_featured FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Service role full access to upcoming movies" ON upcoming_movies_featured;
CREATE POLICY "Service role full access to upcoming movies" 
ON upcoming_movies_featured FOR ALL 
TO service_role 
USING (true);

-- Reviews policies
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

-- ================================================================
-- TRIGGERS
-- ================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_movies_updated_at ON movies;
CREATE TRIGGER update_movies_updated_at 
    BEFORE UPDATE ON movies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_upcoming_movies_updated_at ON upcoming_movies_featured;
CREATE TRIGGER update_upcoming_movies_updated_at 
    BEFORE UPDATE ON upcoming_movies_featured 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at 
    BEFORE UPDATE ON reviews 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- UTILITY FUNCTIONS
-- ================================================================

-- Get user wishlist
CREATE OR REPLACE FUNCTION get_user_wishlist(user_id TEXT)
RETURNS INTEGER[] AS $$
DECLARE
  wishlist INTEGER[];
BEGIN
  SELECT profiles.wishlist INTO wishlist FROM profiles WHERE id = user_id;
  RETURN COALESCE(wishlist, '{}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add movie to wishlist
CREATE OR REPLACE FUNCTION add_to_wishlist(user_id TEXT, movie_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  current_wishlist INTEGER[];
BEGIN
  SELECT wishlist INTO current_wishlist FROM profiles WHERE id = user_id;
  
  IF current_wishlist IS NULL THEN
    current_wishlist := '{}';
  END IF;
  
  IF NOT (movie_id = ANY(current_wishlist)) THEN
    current_wishlist := current_wishlist || movie_id;
    UPDATE profiles SET wishlist = current_wishlist WHERE id = user_id;
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove movie from wishlist
CREATE OR REPLACE FUNCTION remove_from_wishlist(user_id TEXT, movie_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  current_wishlist INTEGER[];
BEGIN
  SELECT wishlist INTO current_wishlist FROM profiles WHERE id = user_id;
  
  IF current_wishlist IS NULL THEN
    RETURN FALSE;
  END IF;
  
  IF movie_id = ANY(current_wishlist) THEN
    current_wishlist := array_remove(current_wishlist, movie_id);
    UPDATE profiles SET wishlist = current_wishlist WHERE id = user_id;
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get movies by category
CREATE OR REPLACE FUNCTION get_movies_by_category(category_name TEXT, limit_count INTEGER DEFAULT 20)
RETURNS SETOF movies AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM movies 
  WHERE category = category_name 
  ORDER BY popularity DESC 
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Search movies
CREATE OR REPLACE FUNCTION search_movies(search_term TEXT, limit_count INTEGER DEFAULT 20)
RETURNS SETOF movies AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM movies 
  WHERE title ILIKE '%' || search_term || '%' 
     OR overview ILIKE '%' || search_term || '%'
  ORDER BY popularity DESC 
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

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

-- Get reviews for a movie
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
-- SETUP COMPLETE
-- ================================================================
-- Your MovieRank database is now ready to use!
-- Make sure to set up your environment variables:
-- - NEXT_PUBLIC_SUPABASE_URL
-- - NEXT_PUBLIC_SUPABASE_ANON_KEY  
-- - SUPABASE_SERVICE_ROLE_KEY
-- ================================================================
