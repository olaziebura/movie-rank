-- Supabase Migration Script for MovieRank
-- This script creates all necessary tables and configurations

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  wishlist INTEGER[] DEFAULT '{}',
  admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create movies table
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

-- Create upcoming_movies table
CREATE TABLE IF NOT EXISTS upcoming_movies (
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
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_admin ON profiles(admin);

CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
CREATE INDEX IF NOT EXISTS idx_movies_category ON movies(category);
CREATE INDEX IF NOT EXISTS idx_movies_popularity ON movies(popularity DESC);
CREATE INDEX IF NOT EXISTS idx_movies_vote_average ON movies(vote_average DESC);
CREATE INDEX IF NOT EXISTS idx_movies_genre_ids ON movies USING GIN (genre_ids);

CREATE INDEX IF NOT EXISTS idx_upcoming_movies_release_date ON upcoming_movies(release_date);
CREATE INDEX IF NOT EXISTS idx_upcoming_movies_is_featured ON upcoming_movies(is_featured);
CREATE INDEX IF NOT EXISTS idx_upcoming_movies_popularity ON upcoming_movies(popularity DESC);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE upcoming_movies ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY IF NOT EXISTS "Users can view their own profile" 
ON profiles FOR SELECT 
TO authenticated 
USING (auth.uid()::text = id);

CREATE POLICY IF NOT EXISTS "Users can update their own profile" 
ON profiles FOR UPDATE 
TO authenticated 
USING (auth.uid()::text = id);

CREATE POLICY IF NOT EXISTS "Service role full access to profiles" 
ON profiles FOR ALL 
TO service_role 
USING (true);

-- Movies policies  
CREATE POLICY IF NOT EXISTS "Public read access for movies" 
ON movies FOR SELECT 
TO public 
USING (true);

CREATE POLICY IF NOT EXISTS "Service role full access to movies" 
ON movies FOR ALL 
TO service_role 
USING (true);

-- Upcoming movies policies
CREATE POLICY IF NOT EXISTS "Public read access for upcoming movies" 
ON upcoming_movies FOR SELECT 
TO public 
USING (true);

CREATE POLICY IF NOT EXISTS "Service role full access to upcoming movies" 
ON upcoming_movies FOR ALL 
TO service_role 
USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER IF NOT EXISTS update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_movies_updated_at 
    BEFORE UPDATE ON movies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_upcoming_movies_updated_at 
    BEFORE UPDATE ON upcoming_movies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add constraints
ALTER TABLE movies ADD CONSTRAINT IF NOT EXISTS check_vote_average 
  CHECK (vote_average >= 0 AND vote_average <= 10);

ALTER TABLE movies ADD CONSTRAINT IF NOT EXISTS check_vote_count 
  CHECK (vote_count >= 0);

ALTER TABLE upcoming_movies ADD CONSTRAINT IF NOT EXISTS check_upcoming_vote_average 
  CHECK (vote_average >= 0 AND vote_average <= 10);

ALTER TABLE upcoming_movies ADD CONSTRAINT IF NOT EXISTS check_upcoming_vote_count 
  CHECK (vote_count >= 0);

-- Create utility functions
CREATE OR REPLACE FUNCTION get_user_wishlist(user_id TEXT)
RETURNS INTEGER[] AS $$
DECLARE
  wishlist INTEGER[];
BEGIN
  SELECT profiles.wishlist INTO wishlist FROM profiles WHERE id = user_id;
  RETURN COALESCE(wishlist, '{}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
