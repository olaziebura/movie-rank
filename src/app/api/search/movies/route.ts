import { NextRequest, NextResponse } from "next/server";
import { discoverWithFilters } from "@/lib/tmdb/movies";
import type { SearchFilters } from "@/types/movie";
import { isMovieInYearRange } from "@/lib/utils/movieFilters";

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
      (filters.sortBy && filters.sortBy !== "popularity.desc");

    // If no query or filters, show popular movies (discover endpoint with default sorting)
    if (!hasQuery && !hasFilters) {
      filters.sortBy = filters.sortBy || "popularity.desc";
    }

    console.log(`[API] Search request - Query: "${filters.query || 'none'}", Filters: ${JSON.stringify({
      genres: filters.genres?.length || 0,
      yearRange: filters.releaseYearFrom || filters.releaseYearTo ? `${filters.releaseYearFrom || '*'}-${filters.releaseYearTo || '*'}` : 'none',
      country: filters.country || 'none',
      minRating: filters.minRating || 'none',
      maxRating: filters.maxRating || 'none',
      sortBy: filters.sortBy || 'default'
    })}`);

    const results = await discoverWithFilters(filters, page);

    // Filter results by year range and rating (client-side validation for search queries)
    const filteredResults = results.results.filter((movie) => {
      // Year range filter
      const passesYear = isMovieInYearRange(
        movie.release_date, 
        filters.releaseYearFrom, 
        filters.releaseYearTo
      );
      
      // Rating filter (additional client-side validation)
      const rating = movie.vote_average || 0;
      const passesMinRating = filters.minRating === undefined || rating >= filters.minRating;
      const passesMaxRating = filters.maxRating === undefined || rating <= filters.maxRating;
      
      return passesYear && passesMinRating && passesMaxRating;
    });

    console.log(`[API] Filtered results: ${results.results.length} → ${filteredResults.length} movies`);

    return NextResponse.json({
      success: true,
      query: filters.query || "",
      filters,
      page,
      total_pages: results.total_pages,
      total_results: filteredResults.length,
      results: filteredResults,
    });
  } catch (error) {
    console.error("Error searching movies:", error);
    return NextResponse.json(
      { error: "Failed to search movies" },
      { status: 500 }
    );
  }
}
