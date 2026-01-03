import { TMDB_CONFIG } from "../utils/constants";
import { tmdbFetch } from "./tmdbFetch";
import type {
  TMDBResponse,
  MovieDetails,
  SearchFilters,
} from "@/types/movie";

export async function getPopularMovies(page = 1): Promise<TMDBResponse> {
  return tmdbFetch(TMDB_CONFIG.ENDPOINTS.POPULAR, {
    page,
  }) as Promise<TMDBResponse>;
}

export async function getUpcomingMovies(page = 1): Promise<TMDBResponse> {
  // Get movies releasing from today up to 3 months in the future
  const today = new Date();
  const threeMonthsLater = new Date(today);
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
  
  const fromDate = today.toISOString().split('T')[0];
  const toDate = threeMonthsLater.toISOString().split('T')[0];
  
  return tmdbFetch(TMDB_CONFIG.ENDPOINTS.DISCOVER_MOVIE, {
    page,
    'primary_release_date.gte': fromDate,
    'primary_release_date.lte': toDate,
    sort_by: 'popularity.desc',
  }) as Promise<TMDBResponse>;
}

export async function getTrendingMovies(
  timeWindow: "day" | "week" = "day"
): Promise<TMDBResponse> {
  return tmdbFetch(`/trending/movie/${timeWindow}`, {
    page: 1,
  }) as Promise<TMDBResponse>;
}

export async function getMovieDetails(
  id: number
): Promise<MovieDetails | null> {
  try {
    const result = await tmdbFetch(
      `${TMDB_CONFIG.ENDPOINTS.MOVIE_DETAILS}/${id}`
    );
    return result as MovieDetails;
  } catch {
    return null;
  }
}

export async function discoverWithFilters(
  filters: SearchFilters,
  page = 1
): Promise<TMDBResponse> {
  const params: Record<string, string | number> = {
    page,
    sort_by: filters.sortBy || "popularity.desc",
  };

  // If there's a text query, use search endpoint (doesn't support sorting or rating filters)
  if (filters.query && filters.query.trim()) {
    console.log(`[TMDB] Using search endpoint with query: "${filters.query}"`);
    const searchResults = await tmdbFetch(TMDB_CONFIG.ENDPOINTS.SEARCH, {
      query: filters.query,
      page,
    }) as TMDBResponse;

    console.log(`[TMDB] Search returned ${searchResults.results.length} results`);

    // Apply client-side filtering for ratings (search endpoint doesn't support it)
    let filteredResults = searchResults.results;
    
    if (filters.minRating !== undefined || filters.maxRating !== undefined) {
      console.log(`[TMDB] Applying rating filter: min=${filters.minRating}, max=${filters.maxRating}`);
      const beforeCount = filteredResults.length;
      
      filteredResults = filteredResults.filter((movie) => {
        const rating = movie.vote_average || 0;
        const passesMin = filters.minRating === undefined || rating >= filters.minRating;
        const passesMax = filters.maxRating === undefined || rating <= filters.maxRating;
        return passesMin && passesMax;
      });
      
      console.log(`[TMDB] Rating filter: ${beforeCount} → ${filteredResults.length} movies`);
    }

    // Apply client-side sorting if sortBy is specified and not default
    if (filters.sortBy && filters.sortBy !== "popularity.desc") {
      const sortedResults = [...filteredResults].sort((a, b) => {
        const [field, direction] = filters.sortBy!.split(".") as [string, "asc" | "desc"];
        
        let valueA: number | string = 0;
        let valueB: number | string = 0;

        switch (field) {
          case "popularity":
            valueA = a.popularity || 0;
            valueB = b.popularity || 0;
            break;
          case "vote_average":
            valueA = a.vote_average || 0;
            valueB = b.vote_average || 0;
            break;
          case "release_date":
            valueA = new Date(a.release_date || 0).getTime();
            valueB = new Date(b.release_date || 0).getTime();
            break;
          default:
            valueA = a.popularity || 0;
            valueB = b.popularity || 0;
        }

        if (direction === "asc") {
          return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        } else {
          return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
        }
      });

      filteredResults = sortedResults;
    }

    return {
      ...searchResults,
      results: filteredResults,
      total_results: filteredResults.length,
    };
  }

  const endpoint = TMDB_CONFIG.ENDPOINTS.DISCOVER_MOVIE;

  if (filters.genres && filters.genres.length > 0) {
    params.with_genres = filters.genres.join(",");
  }

  if (filters.releaseYearFrom) {
    params["release_date.gte"] = `${filters.releaseYearFrom}-01-01`;
  }
  if (filters.releaseYearTo) {
    params["release_date.lte"] = `${filters.releaseYearTo}-12-31`;
  }

  if (filters.minRating !== undefined) {
    params["vote_average.gte"] = filters.minRating;
  }
  if (filters.maxRating !== undefined) {
    params["vote_average.lte"] = filters.maxRating;
  }

  if (filters.country) {
    params.with_origin_country = filters.country;
  }

  params["vote_count.gte"] = 10;

  try {
    return await tmdbFetch(endpoint, params) as TMDBResponse;
  } catch (error) {
    console.error("TMDB Fetch Error:", error);
    throw error;
  }
}
