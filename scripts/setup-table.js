const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupTable() {
  console.log("Setting up database tables...");

  try {
    // Create profiles table
    const { error: profilesError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS profiles (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          wishlist INTEGER[] DEFAULT '{}',
          admin BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    });

    if (profilesError) {
      console.error("Error creating profiles table:", profilesError);
      return;
    }

    // Create movies table
    const { error: moviesError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS movies (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          overview TEXT,
          release_date DATE,
          poster_path TEXT,
          vote_average REAL DEFAULT 0,
          vote_count INTEGER DEFAULT 0,
          popularity REAL DEFAULT 0,
          genre_ids INTEGER[],
          category TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    });

    if (moviesError) {
      console.error("Error creating movies table:", moviesError);
      return;
    }

    console.log("✅ Database tables setup completed!");
  } catch (error) {
    console.error("Setup failed:", error);
  }
}

setupTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to setup tables:", error);
    process.exit(1);
  });
