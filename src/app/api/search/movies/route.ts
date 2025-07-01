import { NextRequest, NextResponse } from "next/server";
import { searchMovies } from "@/lib/tmdb/movies";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const page = parseInt(searchParams.get("page") || "1", 10);

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    if (query.trim().length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters long" },
        { status: 400 }
      );
    }

    const results = await searchMovies(query.trim(), page);

    return NextResponse.json({
      success: true,
      query: query.trim(),
      page,
      total_pages: results.total_pages,
      total_results: results.total_results,
      results: results.results,
    });
  } catch (error) {
    console.error("Error searching movies:", error);
    return NextResponse.json(
      { error: "Failed to search movies" },
      { status: 500 }
    );
  }
}
