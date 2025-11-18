import type { MovieRecord } from "@/types/movie";

export const TMDB_GENRES = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
} as const;

export type GenreId = keyof typeof TMDB_GENRES;
export type GenreName = (typeof TMDB_GENRES)[GenreId];

export function getGenreName(id: number): string {
  return TMDB_GENRES[id as GenreId] || `Unknown Genre (${id})`;
}

export function getGenreId(name: string): number | null {
  const entry = Object.entries(TMDB_GENRES).find(
    ([, genreName]) => genreName.toLowerCase() === name.toLowerCase()
  );
  return entry ? parseInt(entry[0]) : null;
}

export function getGenreNames(ids: number[]): string[] {
  return ids.map((id) => getGenreName(id));
}

export function getAllGenres() {
  return Object.entries(TMDB_GENRES).map(([id, name]) => ({
    id: parseInt(id),
    name,
  }));
}

export class MovieFilterUtils {
  static filterByRating(
    movies: MovieRecord[],
    minRating?: number,
    maxRating?: number
  ) {
    return movies.filter((movie) => {
      const rating = movie.vote_average;
      const passesMin = minRating === undefined || rating >= minRating;
      const passesMax = maxRating === undefined || rating <= maxRating;
      return passesMin && passesMax;
    });
  }

  static filterByYear(
    movies: MovieRecord[],
    startYear?: number,
    endYear?: number
  ) {
    return movies.filter((movie) => {
      const year = new Date(movie.release_date).getFullYear();
      const passesStart = startYear === undefined || year >= startYear;
      const passesEnd = endYear === undefined || year <= endYear;
      return passesStart && passesEnd;
    });
  }

  static filterByGenres(movies: MovieRecord[], genreIds: number[]) {
    if (genreIds.length === 0) return movies;

    return movies.filter(
      (movie) =>
        movie.genres && movie.genres.some((id: number) => genreIds.includes(id))
    );
  }

  static excludeGenres(movies: MovieRecord[], excludeGenreIds: number[]) {
    if (excludeGenreIds.length === 0) return movies;

    return movies.filter(
      (movie) =>
        !movie.genres ||
        !movie.genres.some((id: number) => excludeGenreIds.includes(id))
    );
  }

  static filterByMinVoteCount(movies: MovieRecord[], minVoteCount = 100) {
    return movies.filter((movie) => movie.vote_count >= minVoteCount);
  }

  static sortMovies(
    movies: MovieRecord[],
    sortBy: "rating" | "popularity" | "release_date" | "title",
    order: "asc" | "desc" = "desc"
  ) {
    const sorted = [...movies].sort((a, b) => {
      let valueA, valueB;

      switch (sortBy) {
        case "rating":
          valueA = a.vote_average;
          valueB = b.vote_average;
          break;
        case "popularity":
          valueA = a.popularity;
          valueB = b.popularity;
          break;
        case "release_date":
          valueA = new Date(a.release_date).getTime();
          valueB = new Date(b.release_date).getTime();
          break;
        case "title":
          valueA = a.title.toLowerCase();
          valueB = b.title.toLowerCase();
          break;
        default:
          return 0;
      }

      if (order === "asc") {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });

    return sorted;
  }

  static getTopRatedMovies(
    movies: MovieRecord[],
    limit = 20,
    minVoteCount = 500
  ) {
    return this.sortMovies(
      this.filterByMinVoteCount(movies, minVoteCount),
      "rating",
      "desc"
    ).slice(0, limit);
  }

  static getMostPopularMovies(movies: MovieRecord[], limit = 20) {
    return this.sortMovies(movies, "popularity", "desc").slice(0, limit);
  }

  static getRecentMovies(movies: MovieRecord[], limit = 20, maxAge = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAge);

    const recentMovies = movies.filter(
      (movie) => new Date(movie.release_date) >= cutoffDate
    );

    return this.sortMovies(recentMovies, "release_date", "desc").slice(
      0,
      limit
    );
  }

  static searchMovies(movies: MovieRecord[], searchTerm: string) {
    const lowerSearchTerm = searchTerm.toLowerCase();

    return movies.filter(
      (movie) =>
        movie.title.toLowerCase().includes(lowerSearchTerm) ||
        movie.overview.toLowerCase().includes(lowerSearchTerm)
    );
  }

  static getDiverseSelection(movies: MovieRecord[], limit = 20) {
    const genreGroups: { [key: number]: MovieRecord[] } = {};

    movies.forEach((movie) => {
      if (movie.genres && movie.genres.length > 0) {
        const primaryGenre = movie.genres[0];
        if (!genreGroups[primaryGenre]) {
          genreGroups[primaryGenre] = [];
        }
        genreGroups[primaryGenre].push(movie);
      }
    });

    const diverseMovies: MovieRecord[] = [];
    const genreKeys = Object.keys(genreGroups);
    const moviesPerGenre = Math.max(1, Math.floor(limit / genreKeys.length));

    genreKeys.forEach((genreId) => {
      const genreMovies = this.sortMovies(
        genreGroups[parseInt(genreId)],
        "rating",
        "desc"
      );
      diverseMovies.push(...genreMovies.slice(0, moviesPerGenre));
    });

    if (diverseMovies.length < limit) {
      const remaining = limit - diverseMovies.length;
      const allSorted = this.sortMovies(movies, "rating", "desc");
      const additional = allSorted
        .filter(
          (movie) => !diverseMovies.some((selected) => selected.id === movie.id)
        )
        .slice(0, remaining);

      diverseMovies.push(...additional);
    }

    return diverseMovies.slice(0, limit);
  }
}
