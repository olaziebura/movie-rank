import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth/auth0";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { getMovieDetails } from "@/lib/tmdb/movies";

export async function GET(request: NextRequest) {
  try {
    const session = await auth0.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user?.sub || session.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const privateOnly = searchParams.get("private") === "true";

    // Build query
    let query = supabaseAdmin
      .from("reviews")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Filter for private reviews only if requested
    if (privateOnly) {
      query = query.eq("is_public", false);
    }

    const { data: reviews, error } = await query;

    if (error) {
      console.error("Error fetching user reviews:", error);
      return NextResponse.json(
        { error: "Failed to fetch reviews" },
        { status: 500 }
      );
    }

    // Fetch movie details from TMDB for all reviews
    if (reviews && reviews.length > 0) {
      const movieIds = [...new Set(reviews.map(r => r.movie_id))];
      const moviesMap = new Map<number, { id: number; title: string; poster_path: string | null; release_date: string }>();
      
      // Fetch all movies from TMDB in parallel
      const tmdbPromises = movieIds.map(async (id) => {
        try {
          const details = await getMovieDetails(id);
          if (details) {
            return {
              id: details.id,
              title: details.title,
              poster_path: details.poster_path,
              release_date: details.release_date,
            };
          }
          return null;
        } catch {
          return null;
        }
      });
      
      const tmdbResults = await Promise.all(tmdbPromises);
      
      // Add TMDB results to the map
      tmdbResults.forEach(movie => {
        if (movie) {
          moviesMap.set(movie.id, movie);
        }
      });
      
      const reviewsWithMovies = reviews.map(review => ({
        ...review,
        movie: moviesMap.get(review.movie_id) || null,
      }));

      return NextResponse.json({
        success: true,
        reviews: reviewsWithMovies,
      });
    }

    return NextResponse.json({
      success: true,
      reviews: reviews || [],
    });
  } catch (error) {
    console.error("Error in GET /api/user/reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
