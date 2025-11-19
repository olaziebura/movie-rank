import { TMDB_CONFIG } from "../utils/constants";
import { tmdbFetch } from "./tmdbFetch";
import type {
  TMDBMovie,
  TMDBResponse,
  MovieRecord,
  MovieDetails,
  SearchFilters,
} from "@/types/movie";

export async function getPopularMovies(page = 1): Promise<TMDBResponse> {
  return tmdbFetch(TMDB_CONFIG.ENDPOINTS.POPULAR, {
    page,
  }) as Promise<TMDBResponse>;
}

export async function getTopRatedMovies(page = 1): Promise<TMDBResponse> {
  return tmdbFetch(TMDB_CONFIG.ENDPOINTS.TOP_RATED, {
    page,
  }) as Promise<TMDBResponse>;
}

export async function getNowPlayingMovies(page = 1): Promise<TMDBResponse> {
  return tmdbFetch(TMDB_CONFIG.ENDPOINTS.NOW_PLAYING, {
    page,
  }) as Promise<TMDBResponse>;
}

export async function getUpcomingMovies(page = 1): Promise<TMDBResponse> {
  return tmdbFetch(TMDB_CONFIG.ENDPOINTS.UPCOMING, {
    page,
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

export async function searchMovies(
  query: string,
  page = 1
): Promise<TMDBResponse> {
  return tmdbFetch(TMDB_CONFIG.ENDPOINTS.SEARCH, {
    query,
    page,
  }) as Promise<TMDBResponse>;
}

export async function discoverWithFilters(
  filters: SearchFilters,
  page = 1
): Promise<TMDBResponse> {
  const params: Record<string, string | number> = {
    page,
    sort_by: filters.sortBy || "popularity.desc",
  };

  console.log("discoverWithFilters called with:", { filters, page });

  // Add query if searching by text
  if (filters.query && filters.query.trim()) {
    // Use search endpoint if we have a text query
    return tmdbFetch(TMDB_CONFIG.ENDPOINTS.SEARCH, {
      query: filters.query,
      page,
    }) as Promise<TMDBResponse>;
  }

  // Use discover endpoint for filtering - always use movies
  const endpoint = TMDB_CONFIG.ENDPOINTS.DISCOVER_MOVIE;

  console.log("Using endpoint:", endpoint);

  // Genre filter
  if (filters.genres && filters.genres.length > 0) {
    params.with_genres = filters.genres.join(",");
  }

  // Date range filters - use release_date for movies
  if (filters.releaseYearFrom) {
    params["release_date.gte"] = `${filters.releaseYearFrom}-01-01`;
  }
  if (filters.releaseYearTo) {
    params["release_date.lte"] = `${filters.releaseYearTo}-12-31`;
  }

  // Rating filter
  if (filters.minRating !== undefined) {
    params["vote_average.gte"] = filters.minRating;
  }
  if (filters.maxRating !== undefined) {
    params["vote_average.lte"] = filters.maxRating;
  }

  // Country filter (production country)
  if (filters.country) {
    params.with_origin_country = filters.country;
  }

  // Ensure we have a minimum vote count for relevance
  params["vote_count.gte"] = 10;

  console.log("Final params for TMDB:", params);

  try {
    const result = await tmdbFetch(endpoint, params) as TMDBResponse;
    console.log("TMDB Response:", { 
      endpoint,
      resultsCount: result.results.length,
      totalResults: result.total_results,
      params,
      // Log first 3 movies with their release dates for debugging
      sampleMovies: result.results.slice(0, 3).map(m => ({
        title: m.title,
        release_date: m.release_date,
        id: m.id
      }))
    });
    return result;
  } catch (error) {
    console.error("TMDB Fetch Error:", { endpoint, params, error });
    throw error;
  }
}

export async function searchMoviesEnhanced(
  query: string,
  page = 1
): Promise<TMDBResponse> {
  // Try both movie search and keyword search, then combine results
  const [movieResults, keywordResults] = await Promise.allSettled([
    tmdbFetch(TMDB_CONFIG.ENDPOINTS.SEARCH, {
      query,
      page,
    }) as Promise<TMDBResponse>,
    tmdbFetch("/search/keyword", {
      query,
      page,
    })
      .then(async (keywordResponse: unknown) => {
        // If we found keywords, search for movies with those keywords
        const response = keywordResponse as { results?: { id: number }[] };
        if (response.results && response.results.length > 0) {
          const keywordId = response.results[0].id;
          return tmdbFetch("/discover/movie", {
            with_keywords: keywordId,
            page,
            sort_by: "popularity.desc",
          }) as Promise<TMDBResponse>;
        }
        return { results: [], total_pages: 0, total_results: 0, page };
      })
      .catch(() => ({ results: [], total_pages: 0, total_results: 0, page })),
  ]);

  // Combine results from both searches
  const movies =
    movieResults.status === "fulfilled" ? movieResults.value.results : [];
  const keywordMovies =
    keywordResults.status === "fulfilled" ? keywordResults.value.results : [];

  // Deduplicate movies by ID
  const allMovies = [...movies];
  const movieIds = new Set(movies.map((movie) => movie.id));

  keywordMovies.forEach((movie) => {
    if (!movieIds.has(movie.id)) {
      allMovies.push(movie);
      movieIds.add(movie.id);
    }
  });

  // Sort by popularity and vote average
  allMovies.sort((a, b) => {
    const scoreA = (a.popularity || 0) * 0.7 + (a.vote_average || 0) * 0.3;
    const scoreB = (b.popularity || 0) * 0.7 + (b.vote_average || 0) * 0.3;
    return scoreB - scoreA;
  });

  const movieResult =
    movieResults.status === "fulfilled"
      ? movieResults.value
      : { results: [], total_pages: 0, total_results: 0, page };

  return {
    results: allMovies,
    total_pages: Math.max(movieResult.total_pages, 1),
    total_results: allMovies.length,
    page,
  };
}

export async function getAllMovieCategories(
  maxPages: number
): Promise<MovieRecord[]> {
  const categories = [
    { name: "popular", fetcher: getPopularMovies },
    { name: "top_rated", fetcher: getTopRatedMovies },
    { name: "now_playing", fetcher: getNowPlayingMovies },
    { name: "upcoming", fetcher: getUpcomingMovies },
  ] as const;

  const allMovies = new Map<number, MovieRecord>();

  for (const category of categories) {
    for (let page = 1; page <= maxPages; page++) {
      try {
        const response = await category.fetcher(page);
        const movies = response.results || [];

        movies.forEach((movie: TMDBMovie) => {
          if (!allMovies.has(movie.id)) {
            allMovies.set(movie.id, {
              id: movie.id,
              title: movie.title,
              overview: movie.overview,
              genres: movie.genre_ids || [],
              release_date: movie.release_date,
              poster_path: movie.poster_path,
              vote_average: movie.vote_average,
              vote_count: movie.vote_count,
              popularity: movie.popularity,
              category: category.name,
            });
          }
        });

        await new Promise((resolve) =>
          setTimeout(resolve, TMDB_CONFIG.RATE_LIMIT_DELAY_MS)
        );
      } catch {}
    }
  }

  const totalMovies = Array.from(allMovies.values());

  return totalMovies;
}
