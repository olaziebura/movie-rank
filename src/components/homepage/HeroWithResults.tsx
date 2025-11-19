"use client";

import { useState, useEffect } from "react";
import { MovieItem } from "@/components/MovieItem";
import { PopularMovies } from "@/components/homepage/PopularMovies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Film, Loader2 } from "lucide-react";
import type { TMDBMovie, SearchFilters, Movie } from "@/types/movie";
import type { UserProfile } from "@/types/user";
import { FilterPanel } from "../FilterPanel";

type HeroWithResultsProps = {
  session: unknown;
  profile: UserProfile | null;
  popularMovies?: Movie[] | null;
};

type SearchResult = {
  success: boolean;
  query?: string;
  page: number;
  total_pages: number;
  total_results: number;
  results: TMDBMovie[];
  filters?: SearchFilters;
};

export function HeroWithResults({
  session,
  profile,
  popularMovies,
}: HeroWithResultsProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    genres: [],
    releaseYearFrom: undefined,
    releaseYearTo: undefined,
    country: undefined,
    minRating: undefined,
    maxRating: undefined,
    sortBy: "popularity.desc",
  });
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Function to build filter query params
  const buildFilterParams = (
    currentFilters: SearchFilters
  ): URLSearchParams => {
    const params = new URLSearchParams();

    if (currentFilters.genres && currentFilters.genres.length > 0) {
      params.set("genres", currentFilters.genres.join(","));
    }
    if (currentFilters.releaseYearFrom) {
      params.set("yearFrom", currentFilters.releaseYearFrom.toString());
    }
    if (currentFilters.releaseYearTo) {
      params.set("yearTo", currentFilters.releaseYearTo.toString());
    }
    if (currentFilters.country) {
      params.set("country", currentFilters.country);
    }
    if (currentFilters.minRating !== undefined) {
      params.set("minRating", currentFilters.minRating.toString());
    }
    if (currentFilters.maxRating !== undefined) {
      params.set("maxRating", currentFilters.maxRating.toString());
    }
    if (currentFilters.sortBy) {
      params.set("sortBy", currentFilters.sortBy);
    }

    return params;
  };

  // Check if any filters are active
  const hasActiveFilters = (currentFilters: SearchFilters): boolean => {
    return !!(
      (currentFilters.genres && currentFilters.genres.length > 0) ||
      currentFilters.releaseYearFrom ||
      currentFilters.releaseYearTo ||
      currentFilters.country ||
      currentFilters.minRating !== undefined ||
      currentFilters.maxRating !== undefined ||
      (currentFilters.sortBy && currentFilters.sortBy !== "popularity.desc")
    );
  };

  // Perform search when filters change
  useEffect(() => {
    const performSearch = async () => {
      // Only search if there are active filters
      if (!hasActiveFilters(filters)) {
        setSearchResults(null);
        return;
      }

      setIsSearching(true);
      try {
        const params = buildFilterParams(filters);
        const response = await fetch(`/api/search/movies?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setSearchResults(data);
        } else {
          setSearchResults(null);
        }
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults(null);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [filters]);

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      genres: [],
      releaseYearFrom: undefined,
      releaseYearTo: undefined,
      country: undefined,
      minRating: undefined,
      maxRating: undefined,
      sortBy: "popularity.desc",
    });
    setSearchResults(null);
  };

  const hasResults = searchResults && searchResults.results.length > 0;
  const showPopularMovies = !hasActiveFilters(filters) && !isSearching;

  return (
    <div className="w-full">
      <div className="max-w-[2000px] mx-auto px-4 py-6">
        <div className="flex gap-6 items-start">
          <aside className="w-80 flex-shrink-0">
            <div className="sticky top-24">
              <FilterPanel
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
              />
            </div>
          </aside>

          {/* Results Section */}
          <div className="flex-1 min-w-0">
            {/* Popular Movies - Show when no filters active */}
            {showPopularMovies && popularMovies && (
              <PopularMovies
                movies={popularMovies}
                session={session as never}
                profile={profile}
              />
            )}

            {/* Loading State */}
            {isSearching && (
              <Card className="w-full">
                <CardContent className="p-12 text-center">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Searching movies...</p>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {!isSearching && hasResults && (
              <Card className="w-full bg-white/95 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Film className="w-5 h-5" />
                      Search Results
                    </span>
                    <span className="text-sm font-normal text-gray-500">
                      {searchResults.total_results} found
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                    {searchResults.results.slice(0, 12).map((movie) => (
                      <MovieItem
                        key={movie.id}
                        movie={{
                          id: movie.id,
                          title: movie.title,
                          poster_path: movie.poster_path,
                          vote_average: movie.vote_average,
                          release_date: movie.release_date,
                          vote_count: movie.vote_count,
                          overview: movie.overview,
                          genres: movie.genre_ids || [],
                          popularity: movie.popularity,
                        }}
                        session={session as never}
                        profile={profile}
                        variant="single"
                      />
                    ))}
                  </div>

                  {searchResults.total_results > 12 && (
                    <div className="mt-6 text-center">
                      <a
                        href={`/search?${buildFilterParams(
                          filters
                        ).toString()}`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        View All {searchResults.total_results} Results
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* No Results */}
            {!isSearching &&
              searchResults &&
              searchResults.results.length === 0 && (
                <Card className="w-full">
                  <CardContent className="p-12 text-center">
                    <Film className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No results found
                    </h3>
                    <p className="text-gray-600">
                      Try adjusting your filters or search terms
                    </p>
                  </CardContent>
                </Card>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
