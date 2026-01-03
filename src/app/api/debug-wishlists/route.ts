import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth/auth0";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

interface WishlistRow {
  id: string;
  name: string;
  movie_ids: number[] | null;
  created_at: string;
}

export async function GET() {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.sub || session.user.id;

    const { data: wishlists, error } = await supabaseAdmin
      .from("wishlists")
      .select("id, name, movie_ids, created_at")
      .eq("user_id", userId)
      .order("created_at");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const allMovies: number[] = [];
    const details = wishlists?.map((wishlist: WishlistRow) => {
      const movieIds = wishlist.movie_ids || [];
      allMovies.push(...movieIds);
      return {
        id: wishlist.id,
        name: wishlist.name,
        movie_ids: movieIds,
        count: movieIds.length,
        created_at: wishlist.created_at
      };
    }) || [];

    const uniqueMovies = new Set(allMovies);

    return NextResponse.json({
      wishlists: details,
      summary: {
        total_wishlists: wishlists?.length || 0,
        total_movie_entries: allMovies.length,
        unique_movies: uniqueMovies.size,
        all_movie_ids: allMovies,
        unique_movie_ids: [...uniqueMovies]
      }
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
