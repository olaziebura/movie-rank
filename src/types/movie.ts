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

export type MovieRecord = {
  id: number;
  title: string;
  overview: string;
  genres: number[];
  release_date: string;
  poster_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  category: string;
  created_at?: string;
  updated_at?: string;
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
