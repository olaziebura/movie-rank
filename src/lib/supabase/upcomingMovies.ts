import { supabase } from "./supabase";
import { supabaseAdmin } from "./supabaseAdmin";
import type { Movie } from "@/types/movie";

export interface FeaturedUpcomingMovie {
  id: number;
  title: string;
  overview: string | null;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genres: number[];
  curation_score: number;
  curation_reasoning: string;
  rank_position: number;
  category: string;
  featured_at: string;
  updated_at: string;
}

export type FeaturedUpcomingSortBy =
  | "rank"
  | "curation_score"
  | "vote_average"
  | "popularity"
  | "release_date";
export type SortOrder = "asc" | "desc";

export async function storeFeaturedUpcomingMovies(
  curatedMovies: Array<{
    movie: Movie;
    curationScore: number;
    reasoning: string;
    rank: number;
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error: deleteError } = await supabaseAdmin
      .from("upcoming_movies_featured")
      .delete()
      .neq("id", 0); 

    if (deleteError) {
      console.error("Error clearing existing featured movies:", deleteError);
      return { success: false, error: deleteError.message };
    }

    const moviesData = curatedMovies.map(
      ({ movie, curationScore, reasoning, rank }) => ({
        id: movie.id,
        title: movie.title,
        overview: movie.overview || null,
        release_date: movie.release_date,
        poster_path: movie.poster_path || null,
        backdrop_path: null, 
        vote_average: movie.vote_average,
        vote_count: movie.vote_count,
        popularity: movie.popularity || 0,
        genres: movie.genres || [],
        curation_score: curationScore,
        curation_reasoning: reasoning,
        rank_position: rank,
        category: "upcoming",
      })
    );

    const { error: insertError } = await supabaseAdmin
      .from("upcoming_movies_featured")
      .insert(moviesData)
      .select();

    if (insertError) {
      console.error("Error inserting featured upcoming movies:", insertError);
      return { success: false, error: insertError.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error storing featured upcoming movies:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getFeaturedUpcomingMovies(
  sortBy: FeaturedUpcomingSortBy = "rank",
  sortOrder: SortOrder = "asc",
  limit = 10
): Promise<{
  movies: FeaturedUpcomingMovie[];
  success: boolean;
  error?: string;
}> {
  try {
    // Use regular supabase client (anon key) which should work with RLS policies
    let query = supabase.from("upcoming_movies_featured").select("*");

    switch (sortBy) {
      case "rank":
        query = query.order("rank_position", {
          ascending: sortOrder === "asc",
        });
        break;
      case "curation_score":
        query = query.order("curation_score", {
          ascending: sortOrder === "asc",
        });
        break;
      case "vote_average":
        query = query.order("vote_average", { ascending: sortOrder === "asc" });
        break;
      case "popularity":
        query = query.order("popularity", { ascending: sortOrder === "asc" });
        break;
      case "release_date":
        query = query.order("release_date", { ascending: sortOrder === "asc" });
        break;
      default:
        query = query.order("rank_position", { ascending: true });
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching featured upcoming movies:", error);
      return { movies: [], success: false, error: error.message };
    }

    // Filter movies with release date in the future (compare dates only, not time)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight for fair comparison
    
    const upcomingMovies = (data || []).filter((movie) => {
      const releaseDate = new Date(movie.release_date);
      releaseDate.setHours(0, 0, 0, 0);
      return releaseDate >= today;
    });

    return {
      movies: upcomingMovies,
      success: true,
    };
  } catch (error) {
    console.error("Unexpected error fetching featured upcoming movies:", error);
    return {
      movies: [],
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getFeaturedUpcomingStats(): Promise<{
  totalFeatured: number;
  lastUpdated: string | null;
  averageRating: number;
  averagePopularity: number;
  genreDistribution: { [key: number]: number };
  success: boolean;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("upcoming_movies_featured")
      .select("vote_average, popularity, genres, updated_at");

    if (error) {
      return {
        totalFeatured: 0,
        lastUpdated: null,
        averageRating: 0,
        averagePopularity: 0,
        genreDistribution: {},
        success: false,
        error: error.message,
      };
    }

    const movies = data || [];
    const totalFeatured = movies.length;

    const averageRating =
      totalFeatured > 0
        ? movies.reduce((sum, movie) => sum + movie.vote_average, 0) /
          totalFeatured
        : 0;

    const averagePopularity =
      totalFeatured > 0
        ? movies.reduce((sum, movie) => sum + movie.popularity, 0) /
          totalFeatured
        : 0;

    const genreDistribution: { [key: number]: number } = {};
    movies.forEach((movie) => {
      if (movie.genres) {
        movie.genres.forEach((genreId: number) => {
          genreDistribution[genreId] = (genreDistribution[genreId] || 0) + 1;
        });
      }
    });

    const lastUpdated =
      totalFeatured > 0
        ? movies.reduce((latest, movie) => {
            const movieTime = new Date(movie.updated_at).getTime();
            const latestTime = latest ? new Date(latest).getTime() : 0;
            return movieTime > latestTime ? movie.updated_at : latest;
          }, null as string | null)
        : null;

    return {
      totalFeatured,
      lastUpdated,
      averageRating: Math.round(averageRating * 10) / 10,
      averagePopularity: Math.round(averagePopularity * 10) / 10,
      genreDistribution,
      success: true,
    };
  } catch (error) {
    console.error("Error getting featured upcoming stats:", error);
    return {
      totalFeatured: 0,
      lastUpdated: null,
      averageRating: 0,
      averagePopularity: 0,
      genreDistribution: {},
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function shouldUpdateFeaturedList(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("upcoming_movies_featured")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return true;
    }

    const lastUpdate = new Date(data[0].updated_at);
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    return lastUpdate < twoHoursAgo;
  } catch (error) {
    console.error("Error checking update status:", error);
    return true;
  }
}
