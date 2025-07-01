import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    if (!supabaseServiceKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing SUPABASE_SERVICE_ROLE_KEY environment variable",
        },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    console.log("🚀 Setting up upcoming_movies_featured table...");

    const createTableSQL = `
      -- Create the upcoming_movies_featured table
      CREATE TABLE IF NOT EXISTS upcoming_movies_featured (
          id BIGINT PRIMARY KEY,
          title TEXT NOT NULL,
          overview TEXT,
          release_date DATE NOT NULL,
          poster_path TEXT,
          backdrop_path TEXT,
          vote_average DECIMAL(3,1) DEFAULT 0,
          vote_count INTEGER DEFAULT 0,
          popularity DECIMAL(8,3) DEFAULT 0,
          genres INTEGER[] DEFAULT '{}',
          
          -- Curation specific fields
          curation_score DECIMAL(5,2) NOT NULL DEFAULT 0,
          curation_reasoning TEXT,
          rank_position INTEGER NOT NULL,
          
          -- Metadata
          category TEXT DEFAULT 'upcoming' CHECK (category = 'upcoming'),
          featured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          -- Ensure we only have top 10
          CONSTRAINT valid_rank_position CHECK (rank_position >= 1 AND rank_position <= 10)
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_upcoming_featured_rank ON upcoming_movies_featured(rank_position);
      CREATE INDEX IF NOT EXISTS idx_upcoming_featured_release_date ON upcoming_movies_featured(release_date);
      CREATE INDEX IF NOT EXISTS idx_upcoming_featured_curation_score ON upcoming_movies_featured(curation_score DESC);

      -- Enable RLS
      ALTER TABLE upcoming_movies_featured ENABLE ROW LEVEL SECURITY;

      -- Create policies
      DROP POLICY IF EXISTS "Allow public read access" ON upcoming_movies_featured;
      CREATE POLICY "Allow public read access" ON upcoming_movies_featured
          FOR SELECT USING (true);

      DROP POLICY IF EXISTS "Allow service role full access" ON upcoming_movies_featured;
      CREATE POLICY "Allow service role full access" ON upcoming_movies_featured
          FOR ALL USING (auth.role() = 'service_role');

      -- Grant permissions
      GRANT SELECT ON upcoming_movies_featured TO anon;
      GRANT ALL ON upcoming_movies_featured TO authenticated;
      GRANT ALL ON upcoming_movies_featured TO service_role;
    `;

    const { error: sqlError } = await supabaseAdmin.rpc("exec_sql", {
      sql: createTableSQL,
    });

    if (sqlError) {
      console.error("SQL execution error:", sqlError);

      console.log("Attempting alternative table creation method...");

      const { error: simpleCreateError } = await supabaseAdmin
        .from("upcoming_movies_featured")
        .select("*")
        .limit(1);

      if (simpleCreateError && simpleCreateError.code === "42P01") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Table creation failed. Please create the table manually in Supabase Dashboard.",
            instructions: [
              "1. Go to your Supabase project dashboard",
              "2. Navigate to SQL Editor",
              "3. Copy and paste the SQL from supabase_upcoming_movies_setup.sql",
              "4. Click 'Run' to execute the SQL",
              "5. Then try triggering curation again",
            ],
            sql: createTableSQL,
          },
          { status: 500 }
        );
      }
    }

    const { error: testError } = await supabaseAdmin
      .from("upcoming_movies_featured")
      .select("*")
      .limit(1);

    if (testError) {
      return NextResponse.json(
        {
          success: false,
          error: "Table verification failed: " + testError.message,
          instructions: [
            "Please create the table manually in Supabase Dashboard",
            "Use the SQL from supabase_upcoming_movies_setup.sql",
          ],
        },
        { status: 500 }
      );
    }

    console.log("✅ Table created successfully!");

    console.log("🎬 Triggering initial curation...");

    try {
      const curationResponse = await fetch(
        `${request.nextUrl.origin}/api/upcoming-movies/featured`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            force: true,
            maxPages: 2,
          }),
        }
      );

      if (curationResponse.ok) {
        const curationResult = await curationResponse.json();
        console.log("✨ Initial curation completed!");

        return NextResponse.json({
          success: true,
          message: "Table created and initial curation completed successfully!",
          curation: curationResult,
        });
      } else {
        console.log("⚠️ Table created but curation failed");
        return NextResponse.json({
          success: true,
          message:
            "Table created successfully, but initial curation failed. It will run automatically later.",
          tableCreated: true,
        });
      }
    } catch (curationError) {
      console.error("Curation error:", curationError);
      return NextResponse.json({
        success: true,
        message:
          "Table created successfully, but could not trigger initial curation. It will run automatically later.",
        tableCreated: true,
      });
    }
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to set up the upcoming movies table: " +
          (error as Error).message,
        instructions: [
          "Please create the table manually in Supabase Dashboard",
          "1. Go to SQL Editor in your Supabase project",
          "2. Copy and paste the SQL from supabase_upcoming_movies_setup.sql",
          "3. Execute the SQL",
          "4. Then the feature will work automatically",
        ],
      },
      { status: 500 }
    );
  }
}
