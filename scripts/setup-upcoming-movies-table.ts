import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupUpcomingMoviesTable() {
  console.log("Setting up upcoming_movies table...");

  try {
    // Create the upcoming_movies table
    const { error: createTableError } = await supabase.rpc("exec_sql", {
      sql: `
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
      `,
    });

    if (createTableError) {
      console.error("Error creating table:", createTableError);
      return;
    }

    // Create indexes
    const { error: indexError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_upcoming_movies_release_date ON upcoming_movies(release_date);
        CREATE INDEX IF NOT EXISTS idx_upcoming_movies_is_featured ON upcoming_movies(is_featured);
        CREATE INDEX IF NOT EXISTS idx_upcoming_movies_popularity ON upcoming_movies(popularity);
      `,
    });

    if (indexError) {
      console.error("Error creating indexes:", indexError);
      return;
    }

    // Enable RLS
    const { error: rlsError } = await supabase.rpc("exec_sql", {
      sql: `
        ALTER TABLE upcoming_movies ENABLE ROW LEVEL SECURITY;
        
        -- Allow public read access to upcoming movies
        CREATE POLICY IF NOT EXISTS "Public read access for upcoming movies" 
        ON upcoming_movies FOR SELECT 
        TO public 
        USING (true);
        
        -- Allow authenticated users to insert/update
        CREATE POLICY IF NOT EXISTS "Authenticated users can manage upcoming movies" 
        ON upcoming_movies FOR ALL 
        TO authenticated 
        USING (true);
      `,
    });

    if (rlsError) {
      console.error("Error setting up RLS:", rlsError);
      return;
    }

    console.log("✅ upcoming_movies table setup completed successfully!");
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupUpcomingMoviesTable()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Setup failed:", error);
      process.exit(1);
    });
}

export { setupUpcomingMoviesTable };
