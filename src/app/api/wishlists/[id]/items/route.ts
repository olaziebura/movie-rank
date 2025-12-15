import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth/auth0";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { getMovieDetails } from "@/lib/tmdb/movies";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Check authentication
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.sub ?? session.user.id;
    const { id: wishlistId } = await context.params;

    // Fetch wishlist with movie_ids
    const { data: wishlist, error: wishlistError } = await supabaseAdmin
      .from("wishlists")
      .select("*")
      .eq("id", wishlistId)
      .eq("user_id", userId)
      .single();

    if (wishlistError || !wishlist) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
    }

    const movieIds = wishlist.movie_ids || [];

    // Fetch movie details from TMDB for each movie ID
    const moviePromises = movieIds.map((movieId: number) => getMovieDetails(movieId));
    const movieDetails = await Promise.all(moviePromises);

    // Convert to Movie type and filter out null values
    const movies = movieDetails
      .filter((movie) => movie !== null)
      .map((movieDetail) => ({
        id: movieDetail.id,
        title: movieDetail.title,
        poster_path: movieDetail.poster_path,
        vote_average: movieDetail.vote_average,
        release_date: movieDetail.release_date,
        vote_count: movieDetail.vote_count,
        overview: movieDetail.overview,
        genres: movieDetail.genres.map((g: any) => g.id),
        popularity: movieDetail.popularity,
      }));

    return NextResponse.json({
      success: true,
      movies,
    });
  } catch (error) {
    console.error("Error in GET /api/wishlists/[id]/items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    // Check authentication
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.sub ?? session.user.id;
    const { id: wishlistId } = await context.params;
    const body = await request.json();
    const { movie_id } = body;

    if (!movie_id || typeof movie_id !== "number") {
      return NextResponse.json(
        { error: "Movie ID is required" },
        { status: 400 }
      );
    }

    // Fetch wishlist
    const { data: wishlist, error: wishlistError } = await supabaseAdmin
      .from("wishlists")
      .select("*")
      .eq("id", wishlistId)
      .eq("user_id", userId)
      .single();

    if (wishlistError || !wishlist) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
    }

    const currentMovieIds = wishlist.movie_ids || [];

    // Check if movie already exists in wishlist
    if (currentMovieIds.includes(movie_id)) {
      return NextResponse.json(
        { error: "Movie already in wishlist" },
        { status: 409 }
      );
    }

    // Add movie to the array
    const updatedMovieIds = [...currentMovieIds, movie_id];

    // Update wishlist
    const { data, error } = await supabaseAdmin
      .from("wishlists")
      .update({ movie_ids: updatedMovieIds })
      .eq("id", wishlistId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error adding movie to wishlist:", error);
      return NextResponse.json(
        { error: "Failed to add movie to wishlist" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      wishlist: data,
    });
  } catch (error) {
    console.error("Error in POST /api/wishlists/[id]/items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // Check authentication
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.sub ?? session.user.id;
    const { id: wishlistId } = await context.params;
    
    // Get movieId from request body
    const body = await request.json();
    const { movieId } = body;

    if (!movieId) {
      return NextResponse.json(
        { error: "Movie ID is required" },
        { status: 400 }
      );
    }

    // Fetch wishlist
    const { data: wishlist, error: wishlistError } = await supabaseAdmin
      .from("wishlists")
      .select("*")
      .eq("id", wishlistId)
      .eq("user_id", userId)
      .single();

    if (wishlistError || !wishlist) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
    }

    const currentMovieIds = wishlist.movie_ids || [];
    const movieIdNum = typeof movieId === 'number' ? movieId : parseInt(movieId, 10);

    // Remove movie from array
    const updatedMovieIds = currentMovieIds.filter((id: number) => id !== movieIdNum);

    // Update wishlist
    const { error } = await supabaseAdmin
      .from("wishlists")
      .update({ movie_ids: updatedMovieIds })
      .eq("id", wishlistId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error removing movie from wishlist:", error);
      return NextResponse.json(
        { error: "Failed to remove movie from wishlist" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Movie removed from wishlist",
    });
  } catch (error) {
    console.error("Error in DELETE /api/wishlists/[id]/items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
