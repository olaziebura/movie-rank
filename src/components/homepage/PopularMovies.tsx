"use client";

import { useState, useEffect } from "react";
import type { Movie, SearchFilters } from "@/types/movie";
import { MovieItem } from "../MovieItem";
import { SimplifiedFilterPanel } from "../SimplifiedFilterPanel";
import type { SessionData } from "@auth0/nextjs-auth0/types";
import type { UserProfile } from "@/types/user";

type PopularMoviesProps = {
  movies: Movie[] | null;
  session: SessionData | null;
  profile: UserProfile | null;
};

export const PopularMovies = ({
  movies,
  session,
  profile,
}: PopularMoviesProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: "popularity.desc",
    genres: [],
    minRating: undefined,
  });

  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);

  useEffect(() => {
    if (!movies || movies.length === 0) {
      setFilteredMovies([]);
      return;
    }

    // Filter released movies first
    let processed = movies.filter(
      (m) => new Date(m.release_date) <= new Date()
    );

    // Apply genre filter
    if (filters.genres && filters.genres.length > 0) {
      processed = processed.filter((movie) =>
        filters.genres?.some((genreId) => movie.genres?.includes(genreId))
      );
    }

    // Apply rating filter
    if (filters.minRating !== undefined) {
      processed = processed.filter(
        (movie) => (movie.vote_average || 0) >= filters.minRating!
      );
    }

    // Apply sorting
    if (filters.sortBy) {
      const [field, direction] = filters.sortBy.split(".") as [
        string,
        "asc" | "desc"
      ];

      processed = [...processed].sort((a, b) => {
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
    }

    setFilteredMovies(processed);
  }, [movies, filters]);

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      sortBy: "popularity.desc",
      genres: [],
      minRating: undefined,
    });
  };

  const buildSearchUrl = (): string => {
    const params = new URLSearchParams();
    
    if (filters.sortBy) {
      params.set("sortBy", filters.sortBy);
    }
    if (filters.genres && filters.genres.length > 0) {
      params.set("genres", filters.genres.join(","));
    }
    if (filters.minRating !== undefined) {
      params.set("minRating", filters.minRating.toString());
    }

    return `/search?${params.toString()}`;
  };

  if (!movies || movies.length === 0) {
    return (
      <div className="mx-auto pb-10 p-4">
        <h2 className="text-2xl font-bold mb-4">No movies available</h2>
        <p className="text-lg text-gray-600">Please check back later.</p>
      </div>
    );
  }

  const hasActiveFilters =
    (filters.genres && filters.genres.length > 0) ||
    filters.minRating !== undefined ||
    (filters.sortBy && filters.sortBy !== "popularity.desc");

  // Show 15 movies when filters are active, otherwise show fewer
  const displayCount = hasActiveFilters ? 15 : 15;
  const displayedMovies = filteredMovies.slice(0, displayCount);
  const totalCount = filteredMovies.length;

  return (
    <div className="mx-auto pb-10 p-4">
      <h2 className="text-3xl font-bold mb-6">Popular Movies</h2>

      <div className="flex gap-6 items-start">
        {/* Simplified Filter Panel - Left Side */}
        <aside className="w-80 flex-shrink-0">
          <div className="sticky top-24">
            <SimplifiedFilterPanel
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
            />
          </div>
        </aside>

        {/* Movies Grid - Fills remaining space */}
        <div className="flex-1 min-w-0">
          {displayedMovies.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {displayedMovies.map((movie) => (
                  <MovieItem
                    key={movie.id}
                    profile={profile}
                    session={session}
                    userId={profile?.id}
                    movie={movie}
                    variant="single"
                  />
                ))}
              </div>

              {/* View All Button */}
              {totalCount > displayCount && (
                <div className="mt-6 text-center">
                  <a
                    href={buildSearchUrl()}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
                  >
                    View All Results
                  </a>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600">
                No movies match your filters. Try adjusting your criteria.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
