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
