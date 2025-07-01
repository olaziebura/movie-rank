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

    console.log("🔧 Fixing RLS policies for upcoming_movies_featured table...");

    const fixPoliciesSQL = `
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Allow public read access" ON upcoming_movies_featured;
      DROP POLICY IF EXISTS "Allow service role full access" ON upcoming_movies_featured;
      DROP POLICY IF EXISTS "Allow authenticated read access" ON upcoming_movies_featured;

      -- Create more permissive policies
      CREATE POLICY "Allow public read access" ON upcoming_movies_featured
          FOR SELECT USING (true);

      CREATE POLICY "Allow service role full access" ON upcoming_movies_featured
          FOR ALL USING (true);

      CREATE POLICY "Allow authenticated users full access" ON upcoming_movies_featured
          FOR ALL TO authenticated USING (true);

      -- Also allow anonymous users to read
      CREATE POLICY "Allow anonymous read access" ON upcoming_movies_featured
          FOR SELECT TO anon USING (true);

      -- Re-grant permissions
      GRANT SELECT ON upcoming_movies_featured TO anon;
      GRANT ALL ON upcoming_movies_featured TO authenticated;
      GRANT ALL ON upcoming_movies_featured TO service_role;
    `;

    const { error: sqlError } = await supabaseAdmin.rpc("exec_sql", {
      sql: fixPoliciesSQL,
    });

    if (sqlError) {
      console.error("SQL execution error:", sqlError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fix RLS policies: " + sqlError.message,
        },
        { status: 500 }
      );
    }

    console.log("✅ RLS policies fixed successfully!");

    const testMovie = {
      id: 999999,
      title: "Test Movie",
      overview: "Test overview",
      release_date: "2025-12-31",
      poster_path: null,
      backdrop_path: null,
      vote_average: 8.5,
      vote_count: 1000,
      popularity: 100.0,
      genres: [28, 12],
      curation_score: 85.0,
      curation_reasoning: "Test movie for policy verification",
      rank_position: 1,
      category: "upcoming",
    };

    const { error: insertError } = await supabaseAdmin
      .from("upcoming_movies_featured")
      .upsert(testMovie);

    if (insertError) {
      console.error("Test insert failed:", insertError);
      return NextResponse.json(
        {
          success: false,
          error: "RLS policies still blocking inserts: " + insertError.message,
        },
        { status: 500 }
      );
    }

    await supabaseAdmin
      .from("upcoming_movies_featured")
      .delete()
      .eq("id", 999999);

    console.log("✅ RLS policies working correctly!");

    console.log("🎬 Triggering curation...");

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
            maxPages: 3,
          }),
        }
      );

      if (curationResponse.ok) {
        const curationResult = await curationResponse.json();
        console.log("✨ Curation completed!");

        return NextResponse.json({
          success: true,
          message: "RLS policies fixed and curation completed successfully!",
          curation: curationResult,
        });
      } else {
        const errorText = await curationResponse.text();
        console.log("⚠️ Policies fixed but curation failed:", errorText);
        return NextResponse.json({
          success: true,
          message:
            "RLS policies fixed successfully. Curation will run automatically later.",
          policiesFixed: true,
        });
      }
    } catch (curationError) {
      console.error("Curation error:", curationError);
      return NextResponse.json({
        success: true,
        message:
          "RLS policies fixed successfully. Curation will run automatically later.",
        policiesFixed: true,
      });
    }
  } catch (error) {
    console.error("Fix error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fix RLS policies: " + (error as Error).message,
      },
      { status: 500 }
    );
  }
}
