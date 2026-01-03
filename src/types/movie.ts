export type Movie = {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
  vote_count: number;
  overview: string;
  genres?: number[];
  popularity?: number;
  category?: string;
};

export type TMDBMovie = {
  id: number;
  title: string;
  overview: string;
  genre_ids: number[];
  release_date: string;
  poster_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
};

export type TMDBResponse = {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
};

export type MovieDetails = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  runtime: number;
  genres: Array<{
    id: number;
    name: string;
  }>;
  budget?: number;
  revenue?: number;
  tagline?: string;
  adult?: boolean;
  original_language?: string;
  original_title?: string;
  production_companies?: Array<{
    id: number;
    name: string;
    logo_path: string | null;
  }>;
};

export type Review = {
  id: string;
  user_id: string;
  movie_id: number;
  rating: number;
  comment: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type ReviewWithUser = Review & {
  user_name: string;
  user_email: string;
};

export type MovieStats = {
  tmdb_rating: number;
  tmdb_count: number;
  user_rating: number;
  user_count: number;
  combined_rating: number;
};

export type CreateReviewInput = {
  movie_id: number;
  rating: number;
  comment?: string;
  is_public?: boolean;
};

export type UpdateReviewInput = {
  rating?: number;
  comment?: string;
  is_public?: boolean;
};

export type MediaType = "movie" | "tv" | "all";

export type SearchFilters = {
  query?: string;
  mediaType?: MediaType;
  genres?: number[];
  releaseYearFrom?: number;
  releaseYearTo?: number;
  country?: string;
  minRating?: number;
  maxRating?: number;
  sortBy?: 
    | "popularity.desc" 
    | "popularity.asc" 
    | "release_date.desc" 
    | "release_date.asc" 
    | "vote_average.desc" 
    | "vote_average.asc"
    | "title.asc"
    | "title.desc";
};
