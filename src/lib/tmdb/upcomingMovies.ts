import { tmdbFetch } from "./tmdbFetch";
import type { Movie } from "@/types/movie";

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

export async function getUpcomingMovies(page = 1): Promise<{
  movies: Movie[];
  totalPages: number;
  totalResults: number;
}> {
  try {
    const response = (await tmdbFetch("/movie/upcoming", {
      page: page.toString(),
      language: "en-US",
      region: "US", // Focus on US releases for consistency
    })) as {
      results: Movie[];
      total_pages: number;
      total_results: number;
    };

    if (!response.results) {
      throw new Error("No upcoming movies data received");
    }

    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);

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

export async function getUpcomingMovieDetails(
  movieId: number
): Promise<UpcomingMovieDetail> {
  try {
    const response = (await tmdbFetch(`/movie/${movieId}`, {
      language: "en-US",
      append_to_response: "genres,production_companies",
    })) as UpcomingMovieDetail;

    return response;
  } catch (error) {
    console.error(`Error fetching details for movie ${movieId}:`, error);
    throw error;
  }
}

export async function getBatchUpcomingMovies(
  maxPages: number
): Promise<Movie[]> {
  const pagePromises = Array.from({ length: maxPages }, (_, index) =>
    getUpcomingMovies(index + 1).then(res => res).catch(() => null)
  );

  const results = await Promise.allSettled(pagePromises);

  const allMovies: Movie[] = [];
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      allMovies.push(...result.value.movies);
    }
  }

  const uniqueMoviesMap = new Map<number, Movie>();
  for (const movie of allMovies) {
    if (!uniqueMoviesMap.has(movie.id)) {
      uniqueMoviesMap.set(movie.id, movie);
    }
  }

  const uniqueMovies = Array.from(uniqueMoviesMap.values());
  return uniqueMovies.sort(
    (a, b) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
  );
}

export function calculateWorthWaitingScore(movie: Movie): {
  score: number;
  reasoning: string;
} {
  let score = 0;
  const factors: string[] = [];

  const ratingScore = (movie.vote_average / 10) * 40;
  score += ratingScore;
  if (movie.vote_average >= 7.5) {
    factors.push(`High rating (${movie.vote_average}/10)`);
  }

  const popularityScore = Math.min(((movie.popularity || 0) / 100) * 30, 30);
  score += popularityScore;
  if ((movie.popularity || 0) > 50) {
    factors.push(
      `High buzz (popularity: ${(movie.popularity || 0).toFixed(1)})`
    );
  }

  const voteCountScore = Math.min((movie.vote_count / 1000) * 15, 15);
  score += voteCountScore;
  if (movie.vote_count > 500) {
    factors.push(`Strong audience interest (${movie.vote_count} votes)`);
  }

  const anticipatedGenres = [28, 878, 14, 12, 53];
  const blockbusterGenres = [28, 878, 14, 12];

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

  const releaseDate = new Date(movie.release_date);
  const month = releaseDate.getMonth() + 1;
  const primeMonths = [5, 6, 7, 11, 12];

  if (primeMonths.includes(month)) {
    score += 5;
    factors.push("Prime release window");
  }

  if (movie.overview && movie.overview.length > 200) {
    score += 5;
    factors.push("Detailed plot description");
  }

  const reasoning =
    factors.length > 0
      ? `Selected for: ${factors.join(", ")}`
      : "Solid upcoming release with good potential";

  return {
    score: Math.round(score * 100) / 100,
    reasoning,
  };
}
