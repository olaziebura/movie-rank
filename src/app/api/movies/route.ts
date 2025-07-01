import { NextResponse } from "next/server";
import { getMoviesFromDatabase } from "@/lib/supabase/movies";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const options = {
      limit: parseInt(searchParams.get("limit") || "20"),
      offset: parseInt(searchParams.get("offset") || "0"),
      category: searchParams.get("category") || undefined,
      minRating: searchParams.get("minRating")
        ? parseFloat(searchParams.get("minRating")!)
        : undefined,
      maxRating: searchParams.get("maxRating")
        ? parseFloat(searchParams.get("maxRating")!)
        : undefined,
      search: searchParams.get("search") || undefined,
      sortBy:
        (searchParams.get("sortBy") as
          | "vote_average"
          | "popularity"
          | "release_date") || undefined,
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
      genres: searchParams.get("genres")
        ? searchParams
            .get("genres")!
            .split(",")
            .map((id) => parseInt(id.trim()))
            .filter((id) => !isNaN(id))
        : undefined,
    };

    const movies = await getMoviesFromDatabase(options);

    return NextResponse.json(
      {
        movies,
        count: movies.length,
        filters: options,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching movies:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch movies",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
