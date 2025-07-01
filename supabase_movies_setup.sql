-- Movies Table Setup for MovieRank
-- This script creates the movies table for caching TMDB movie data

-- Create the movies table
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
  category TEXT, -- 'popular', 'top_rated', 'now_playing', 'upcoming'
  adult BOOLEAN DEFAULT false,
  original_language TEXT,
  original_title TEXT,
  video BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
CREATE INDEX IF NOT EXISTS idx_movies_release_date ON movies(release_date);
CREATE INDEX IF NOT EXISTS idx_movies_category ON movies(category);
CREATE INDEX IF NOT EXISTS idx_movies_popularity ON movies(popularity DESC);
CREATE INDEX IF NOT EXISTS idx_movies_vote_average ON movies(vote_average DESC);
CREATE INDEX IF NOT EXISTS idx_movies_genre_ids ON movies USING GIN (genre_ids);
CREATE INDEX IF NOT EXISTS idx_movies_updated_at ON movies(updated_at);

-- Enable Row Level Security
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Allow public read access to movies
CREATE POLICY IF NOT EXISTS "Public read access for movies" 
ON movies FOR SELECT 
TO public 
USING (true);

-- Allow authenticated users to read movies
CREATE POLICY IF NOT EXISTS "Authenticated users can read movies" 
ON movies FOR SELECT 
TO authenticated 
USING (true);

-- Allow service role full access for sync operations
CREATE POLICY IF NOT EXISTS "Service role full access to movies" 
ON movies FOR ALL 
TO service_role 
USING (true);

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_movies_updated_at 
    BEFORE UPDATE ON movies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add constraints
ALTER TABLE movies ADD CONSTRAINT check_vote_average 
  CHECK (vote_average >= 0 AND vote_average <= 10);

ALTER TABLE movies ADD CONSTRAINT check_vote_count 
  CHECK (vote_count >= 0);

ALTER TABLE movies ADD CONSTRAINT check_popularity 
  CHECK (popularity >= 0);

-- Add comments for documentation
COMMENT ON TABLE movies IS 'Cached movie data from TMDB API';
COMMENT ON COLUMN movies.id IS 'TMDB movie ID (primary key)';
COMMENT ON COLUMN movies.category IS 'TMDB category: popular, top_rated, now_playing, upcoming';
COMMENT ON COLUMN movies.genre_ids IS 'Array of TMDB genre IDs';
COMMENT ON COLUMN movies.adult IS 'Adult content flag from TMDB';
COMMENT ON COLUMN movies.video IS 'Video availability flag from TMDB';

-- Create function to get movies by category
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

-- Create function to search movies
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
