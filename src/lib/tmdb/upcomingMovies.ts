import { tmdbFetch } from "./tmdbFetch";
import type { Movie } from "@/types/movie";

// Extended interface for upcoming movies with additional TMDB data
export interface UpcomingMovieDetail extends Movie {
  adult: boolean;
  video: boolean;
  budget?: number;
  revenue?: number;
  runtime?: number;
  status: string;
  tagline?: string;
  production_companies?: Array<{
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
  }>;
}

/**
 * Fetch upcoming movies from TMDB
 * These are movies that have been announced and have a release date in the future
 */
export async function getUpcomingMovies(page = 1): Promise<{
  movies: Movie[];
  totalPages: number;
  totalResults: number;
}> {
  try {
    const response = await tmdbFetch("/movie/upcoming", {
      page: page.toString(),
      language: "en-US",
      region: "US", // Focus on US releases for consistency
    });

    if (!response.results) {
      throw new Error("No upcoming movies data received");
    }

    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000); // 6 months ago

    const movies = response.results.filter(
      (movie: Movie) =>
        movie.id &&
        movie.title &&
        movie.release_date &&
        new Date(movie.release_date) > sixMonthsAgo
    );

    return {
      movies,
      totalPages: response.total_pages || 1,
      totalResults: response.total_results || movies.length,
    };
  } catch (error) {
    console.error("Error fetching upcoming movies:", error);
    throw error;
  }
}

/**
 * Fetch detailed information for a specific upcoming movie
 */
export async function getUpcomingMovieDetails(
  movieId: number
): Promise<UpcomingMovieDetail> {
  try {
    const response = await tmdbFetch(`/movie/${movieId}`, {
      language: "en-US",
      append_to_response: "genres,production_companies",
    });

    return response as UpcomingMovieDetail;
  } catch (error) {
    console.error(`Error fetching details for movie ${movieId}:`, error);
    throw error;
  }
}

/**
 * Fetch multiple pages of upcoming movies for better selection
 * This gives us a larger pool to curate from
 */
export async function getBatchUpcomingMovies(maxPages = 5): Promise<Movie[]> {
  try {
    console.log(`Fetching upcoming movies from ${maxPages} pages...`);

    const allMovies: Movie[] = [];
    const fetchPromises: Promise<{
      movies: Movie[];
      totalPages: number;
      totalResults: number;
    }>[] = [];

    // Fetch multiple pages in parallel for efficiency
    for (let page = 1; page <= maxPages; page++) {
      fetchPromises.push(getUpcomingMovies(page));
    }

    const results = await Promise.allSettled(fetchPromises);

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        allMovies.push(...result.value.movies);
        console.log(
          `Page ${index + 1}: ${result.value.movies.length} movies fetched`
        );
      } else {
        console.error(`Failed to fetch page ${index + 1}:`, result.reason);
      }
    });

    // Remove duplicates and filter for quality
    const uniqueMovies = allMovies
      .filter(
        (movie, index, arr) => arr.findIndex((m) => m.id === movie.id) === index
      )
      .filter((movie) => {
        const releaseDate = new Date(movie.release_date);
        const now = new Date();
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(now.getFullYear() + 1);

        return (
          releaseDate > now && // Must be upcoming
          releaseDate <= oneYearFromNow && // Within 1 year (extended)
          (movie.vote_count || 0) >= 0 && // Any vote count (relaxed)
          (movie.popularity || 0) > 1 && // Very low popularity threshold
          movie.overview && // Just needs an overview
          movie.overview.length > 10 // Minimal description requirement
        );
      });

    console.log(`Total unique upcoming movies found: ${uniqueMovies.length}`);
    return uniqueMovies;
  } catch (error) {
    console.error("Error in batch fetching upcoming movies:", error);
    throw error;
  }
}

/**
 * Calculate a "worth waiting for" score based on multiple factors
 * This is our secret sauce for curating the best upcoming movies
 */
export function calculateWorthWaitingScore(movie: Movie): {
  score: number;
  reasoning: string;
} {
  let score = 0;
  const factors: string[] = [];

  // Base score from TMDB rating (40% weight)
  const ratingScore = (movie.vote_average / 10) * 40;
  score += ratingScore;
  if (movie.vote_average >= 7.5) {
    factors.push(`High rating (${movie.vote_average}/10)`);
  }

  // Popularity score (30% weight) - normalized
  const popularityScore = Math.min(((movie.popularity || 0) / 100) * 30, 30);
  score += popularityScore;
  if ((movie.popularity || 0) > 50) {
    factors.push(
      `High buzz (popularity: ${(movie.popularity || 0).toFixed(1)})`
    );
  }

  // Vote count indicates audience interest (15% weight)
  const voteCountScore = Math.min((movie.vote_count / 1000) * 15, 15);
  score += voteCountScore;
  if (movie.vote_count > 500) {
    factors.push(`Strong audience interest (${movie.vote_count} votes)`);
  }

  // Genre bonus (15% weight) - Some genres are more anticipated
  const anticipatedGenres = [28, 878, 14, 12, 53]; // Action, Sci-Fi, Fantasy, Adventure, Thriller
  const blockbusterGenres = [28, 878, 14, 12]; // Action, Sci-Fi, Fantasy, Adventure

  let genreBonus = 0;
  const movieGenres = movie.genres || [];
  if (movieGenres.some((g) => blockbusterGenres.includes(g))) {
    genreBonus = 15;
    factors.push("Blockbuster genre");
  } else if (movieGenres.some((g) => anticipatedGenres.includes(g))) {
    genreBonus = 10;
    factors.push("Highly anticipated genre");
  } else {
    genreBonus = 5;
  }
  score += genreBonus;

  // Release timing bonus - movies releasing in prime months get bonus
  const releaseDate = new Date(movie.release_date);
  const month = releaseDate.getMonth() + 1; // 1-12
  const primeMonths = [5, 6, 7, 11, 12]; // May, June, July (summer), November, December (holiday)

  if (primeMonths.includes(month)) {
    score += 5;
    factors.push("Prime release window");
  }

  // Overview quality bonus - longer, more detailed overviews suggest more developed films
  if (movie.overview && movie.overview.length > 200) {
    score += 5;
    factors.push("Detailed plot description");
  }

  const reasoning =
    factors.length > 0
      ? `Selected for: ${factors.join(", ")}`
      : "Solid upcoming release with good potential";

  return {
    score: Math.round(score * 100) / 100, // Round to 2 decimal places
    reasoning,
  };
}
