import { supabase } from "./supabase";
import type { MovieRecord } from "@/types/movie";

export async function upsertMovies(movies: MovieRecord[]) {
  try {
    const { data, error } = await supabase
      .from("movies")
      .upsert(movies, {
        onConflict: "id",
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export async function getMoviesFromDatabase(
  options: {
    limit?: number;
    offset?: number;
    category?: string;
    minRating?: number;
    maxRating?: number;
    genres?: number[];
    search?: string;
    sortBy?: "vote_average" | "popularity" | "release_date";
    sortOrder?: "asc" | "desc";
  } = {}
) {
  try {
    let query = supabase.from("movies").select("*");

    if (options.category) {
      query = query.eq("category", options.category);
    }

    if (options.minRating !== undefined) {
      query = query.gte("vote_average", options.minRating);
    }

    if (options.maxRating !== undefined) {
      query = query.lte("vote_average", options.maxRating);
    }

    if (options.genres && options.genres.length > 0) {
      query = query.overlaps("genres", options.genres);
    }

    if (options.search) {
      query = query.or(
        `title.ilike.%${options.search}%,overview.ilike.%${options.search}%`
      );
    }

    if (options.sortBy) {
      query = query.order(options.sortBy, {
        ascending: options.sortOrder === "asc",
      });
    } else {
      query = query.order("popularity", { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 20) - 1
      );
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw error;
  }
}

export async function getMovieFromDatabase(id: number) {
  try {
    const { data, error } = await supabase
      .from("movies")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export async function getMoviesByGenre(genreIds: number[], limit = 20) {
  return getMoviesFromDatabase({
    genres: genreIds,
    limit,
    sortBy: "vote_average",
    sortOrder: "desc",
  });
}

export async function getTopRatedMoviesFromDatabase(limit = 20) {
  return getMoviesFromDatabase({
    minRating: 7.0,
    limit,
    sortBy: "vote_average",
    sortOrder: "desc",
  });
}

export async function getPopularMoviesFromDatabase(limit = 20) {
  return getMoviesFromDatabase({
    limit,
    sortBy: "popularity",
    sortOrder: "desc",
  });
}

export async function getRecentMoviesFromDatabase(limit = 20) {
  return getMoviesFromDatabase({
    limit,
    sortBy: "release_date",
    sortOrder: "desc",
  });
}

export async function searchMoviesInDatabase(searchTerm: string, limit = 20) {
  return getMoviesFromDatabase({
    search: searchTerm,
    limit,
    sortBy: "popularity",
    sortOrder: "desc",
  });
}

export async function getMoviesDatabaseStats() {
  try {
    const { count: totalMovies } = await supabase
      .from("movies")
      .select("*", { count: "exact", head: true });

    const { data: lastUpdate } = await supabase
      .from("movies")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    const { data: categories } = await supabase
      .from("movies")
      .select("category")
      .not("category", "is", null);

    const categoryCount = categories?.reduce((acc, movie) => {
      acc[movie.category] = (acc[movie.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalMovies: totalMovies || 0,
      lastUpdate: lastUpdate?.updated_at,
      categories: categoryCount || {},
    };
  } catch (error) {
    throw error;
  }
}
