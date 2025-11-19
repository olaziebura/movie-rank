import { NextRequest, NextResponse } from "next/server";
import { discoverWithFilters } from "@/lib/tmdb/movies";
import type { SearchFilters } from "@/types/movie";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Build filters object from query parameters
    const filters: SearchFilters = {
      query: searchParams.get("q") || undefined,
      genres: searchParams.get("genres")
        ? searchParams.get("genres")!.split(",").map(Number)
        : undefined,
      releaseYearFrom: searchParams.get("yearFrom")
        ? parseInt(searchParams.get("yearFrom")!)
        : undefined,
      releaseYearTo: searchParams.get("yearTo")
        ? parseInt(searchParams.get("yearTo")!)
        : undefined,
      country: searchParams.get("country") || undefined,
      minRating: searchParams.get("minRating")
        ? parseFloat(searchParams.get("minRating")!)
        : undefined,
      maxRating: searchParams.get("maxRating")
        ? parseFloat(searchParams.get("maxRating")!)
        : undefined,
      sortBy: (searchParams.get("sortBy") as SearchFilters["sortBy"]) || "popularity.desc",
    };

    const page = parseInt(searchParams.get("page") || "1", 10);

    // Validate that we have either a query or some filters
    const hasQuery = filters.query && filters.query.trim().length >= 2;
    const hasFilters = 
      filters.genres?.length ||
      filters.releaseYearFrom ||
      filters.releaseYearTo ||
      filters.country ||
      filters.minRating ||
      filters.maxRating ||
      (filters.sortBy && filters.sortBy !== "popularity.desc"); // Count non-default sorting as a filter

    if (!hasQuery && !hasFilters) {
      return NextResponse.json(
        { error: "Please provide a search query or select filters" },
        { status: 400 }
      );
    }

    const results = await discoverWithFilters(filters, page);

    return NextResponse.json({
      success: true,
      query: filters.query || "",
      filters,
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
