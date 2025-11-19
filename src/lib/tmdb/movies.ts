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
