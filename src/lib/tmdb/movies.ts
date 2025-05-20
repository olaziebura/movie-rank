import { tmdbFetch } from "./tmdbFetch";

// Fetches the popular movies from the TMDB API.
export async function getPopularMovies(page = 1) {
  return tmdbFetch("/movie/popular", { page });
}

// Fetches the top-rated movies from the TMDB API.
export async function getMovieDetails(id: number) {
  return tmdbFetch(`/movie/${id}`);
}

// Searches for movies in the TMDB API by title.
export async function searchMovies(query: string, page = 1) {
  return tmdbFetch("/search/movie", { query, page });
}
