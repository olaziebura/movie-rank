"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";
import { SearchSuggestions } from "@/components/SearchSuggestions";
import { MovieItem } from "@/components/MovieItem";
import { HorizontalFilterPanel } from "@/components/HorizontalFilterPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, ArrowLeft, ArrowRight, Film } from "lucide-react";
import type { Movie, SearchFilters, MediaType, TMDBMovie } from "@/types/movie";
import { isMovieInYearRange } from "@/lib/utils/movieFilters";
import { useUserProfile } from "@/hooks/useUserProfile";
import { GENRE_NAMES, COUNTRIES } from "@/lib/utils/constants";

type SearchResult = {
  success: boolean;
  query: string;
  page: number;
  total_pages: number;
  total_results: number;
  results: TMDBMovie[];
};

// Empty search state component
function EmptySearchState() {
  return (
    <div className="text-center py-16">
      <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
        <Search className="w-12 h-12 text-blue-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        Search for Movies
      </h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Use the search bar above to find movies by title, actor, or director.
        Discover your next favorite film from our extensive database.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild>
          <Link href="/" className="flex items-center gap-2">
            <Film className="w-4 h-4" />
            Browse Popular Movies
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/wishlist" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            View My Wishlist
          </Link>
        </Button>
      </div>
    </div>
  );
}

// No results component
function NoResults({ query, filters }: { query: string; filters: SearchFilters }) {
  const activeFilters: string[] = [];
  
  if (filters.genres && filters.genres.length > 0) {
    const genreNames = filters.genres
      .map(id => GENRE_NAMES[id])
      .filter(Boolean)
      .join(", ");
    activeFilters.push(`Genres: ${genreNames}`);
  }
  if (filters.releaseYearFrom || filters.releaseYearTo) {
    const yearRange = filters.releaseYearFrom && filters.releaseYearTo 
      ? `${filters.releaseYearFrom}-${filters.releaseYearTo}`
      : filters.releaseYearFrom 
      ? `from ${filters.releaseYearFrom}`
      : `until ${filters.releaseYearTo}`;
    activeFilters.push(`Year: ${yearRange}`);
  }
  if (filters.country) {
    const countryName = COUNTRIES.find(c => c.code === filters.country)?.name || filters.country;
    activeFilters.push(`Country: ${countryName}`);
  }
  if (filters.minRating) {
    activeFilters.push(`Rating: ${filters.minRating}+ ⭐`);
  }
  if (filters.sortBy && filters.sortBy !== "popularity.desc") {
    const sortLabel = filters.sortBy.includes("popularity") ? "Popularity" :
                     filters.sortBy.includes("vote_average") ? "Rating" :
                     filters.sortBy.includes("release_date") ? "Release Date" : "Custom";
    const direction = filters.sortBy.includes(".desc") ? "↓" : "↑";
    activeFilters.push(`Sort: ${sortLabel} ${direction}`);
  }

  return (
    <div className="text-center py-16">
      <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Film className="w-12 h-12 text-gray-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        No movies found
      </h2>
      
      {query && (
        <p className="text-lg text-gray-700 mb-2">
          for search: <span className="font-semibold text-blue-600">&ldquo;{query}&rdquo;</span>
        </p>
      )}
      
      {activeFilters.length > 0 && (
        <div className="mb-6 max-w-3xl mx-auto">
          <p className="text-sm text-gray-600 mb-3 font-medium">Active Filters:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {activeFilters.map((filter, index) => (
              <span
                key={index}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border border-blue-200 shadow-sm"
              >
                {filter}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        {activeFilters.length > 0 
          ? "Try removing some filters or adjusting your criteria to see more results."
          : "Try different search terms or add some filters to find movies."}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild>
          <Link href="/" className="flex items-center gap-2">
            <Film className="w-4 h-4" />
            Browse Popular Movies
          </Link>
        </Button>
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </Button>
      </div>
    </div>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, userId } = useUserProfile();

  // Parse URL parameters
  const query = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  // Initialize filters from URL
  const [filters, setFilters] = useState<SearchFilters>({
    query: query || undefined,
    mediaType: (searchParams.get("mediaType") as MediaType) || "movie",
    genres: searchParams.get("genres")
      ? searchParams.get("genres")!.split(",").map(Number)
      : undefined,
    releaseYearFrom: searchParams.get("yearFrom")
      ? parseInt(searchParams.get("yearFrom")!)
      : undefined,
    releaseYearTo: searchParams.get("yearTo")
      ? parseInt(searchParams.get("yearTo")!)
      : undefined,
    country: searchParams.get("country") || undefined,
    minRating: searchParams.get("minRating")
      ? parseFloat(searchParams.get("minRating")!)
      : undefined,
    maxRating: searchParams.get("maxRating")
      ? parseFloat(searchParams.get("maxRating")!)
      : undefined,
    sortBy: (searchParams.get("sortBy") as SearchFilters["sortBy"]) || "popularity.desc",
  });

  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const hasQuery = query.trim();
  const hasFilters = !!(
    filters.genres?.length ||
    filters.releaseYearFrom ||
    filters.releaseYearTo ||
    filters.country ||
    filters.minRating ||
    filters.maxRating ||
    (filters.mediaType && filters.mediaType !== "movie") ||
    (filters.sortBy && filters.sortBy !== "popularity.desc")
  );

  // Always show results - either from search/filters or popular movies
  const shouldShowResults = true;

  // Build URL for pagination and filter updates
  const buildUrl = (newPage?: number, newFilters?: SearchFilters) => {
    const params = new URLSearchParams();
    const currentFilters = newFilters || filters;
    const currentPage = newPage || page;

    if (query) params.set("q", query);
    if (currentFilters.mediaType) params.set("mediaType", currentFilters.mediaType);
    if (currentFilters.genres?.length) params.set("genres", currentFilters.genres.join(","));
    if (currentFilters.releaseYearFrom) params.set("yearFrom", currentFilters.releaseYearFrom.toString());
    if (currentFilters.releaseYearTo) params.set("yearTo", currentFilters.releaseYearTo.toString());
    if (currentFilters.country) params.set("country", currentFilters.country);
    if (currentFilters.minRating) params.set("minRating", currentFilters.minRating.toString());
    if (currentFilters.maxRating) params.set("maxRating", currentFilters.maxRating.toString());
    if (currentFilters.sortBy) params.set("sortBy", currentFilters.sortBy);
    params.set("page", currentPage.toString());

    return `/search?${params.toString()}`;
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    router.push(buildUrl(1, newFilters));
  };

  const handleClearFilters = () => {
    const clearedFilters: SearchFilters = {
      query: query || undefined,
      mediaType: "movie",
      genres: undefined,
      releaseYearFrom: undefined,
      releaseYearTo: undefined,
      country: undefined,
      minRating: undefined,
      maxRating: undefined,
      sortBy: "popularity.desc",
    };
    setFilters(clearedFilters);
    router.push(buildUrl(1, clearedFilters));
  };

  // Perform search when URL parameters change
  useEffect(() => {
    const performSearch = async () => {
      setIsLoading(true);
      try {
        let apiUrl = "";
        
        // If there's a query or filters, use search API
        if (hasQuery || hasFilters) {
          const params = new URLSearchParams();
          if (query) params.set("q", query);
          if (filters.mediaType) params.set("mediaType", filters.mediaType);
          if (filters.genres?.length) params.set("genres", filters.genres.join(","));
          if (filters.releaseYearFrom) params.set("yearFrom", filters.releaseYearFrom.toString());
          if (filters.releaseYearTo) params.set("yearTo", filters.releaseYearTo.toString());
          if (filters.country) params.set("country", filters.country);
          if (filters.minRating) params.set("minRating", filters.minRating.toString());
          if (filters.maxRating) params.set("maxRating", filters.maxRating.toString());
          if (filters.sortBy) params.set("sortBy", filters.sortBy);
          params.set("page", page.toString());
          
          apiUrl = `/api/search/movies?${params.toString()}`;
        } else {
          // No query or filters - show popular movies with sorting
          const params = new URLSearchParams();
          params.set("sortBy", filters.sortBy || "popularity.desc");
          params.set("page", page.toString());
          apiUrl = `/api/search/movies?${params.toString()}`;
        }

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.success) {
          setSearchResults(data);

          // Convert TMDBMovie to Movie type and filter by year range and rating
          let convertedMovies = data.results
            .filter((movie: TMDBMovie) => {
              // Filter by year range
              const passesYear = isMovieInYearRange(
                movie.release_date, 
                filters.releaseYearFrom, 
                filters.releaseYearTo
              );
              
              // Filter by rating (client-side validation for search queries)
              const rating = movie.vote_average || 0;
              const passesMinRating = filters.minRating === undefined || rating >= filters.minRating;
              const passesMaxRating = filters.maxRating === undefined || rating <= filters.maxRating;
              
              return passesYear && passesMinRating && passesMaxRating;
            })
            .map((movie: TMDBMovie) => ({
              id: movie.id,
              title: movie.title,
              poster_path: movie.poster_path,
              vote_average: movie.vote_average,
              release_date: movie.release_date,
              vote_count: movie.vote_count,
              overview: movie.overview,
              genres: movie.genre_ids || [],
              popularity: movie.popularity,
            }));

          // Apply client-side sorting to ensure it works correctly
          if (filters.sortBy) {
            const [field, direction] = filters.sortBy.split(".") as [string, "asc" | "desc"];
            
            console.log(`Applying client-side sorting: ${field} (${direction})`);
            
            convertedMovies = [...convertedMovies].sort((a, b) => {
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
                case "title":
                  valueA = a.title.toLowerCase();
                  valueB = b.title.toLowerCase();
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
            
            console.log(`Sorted ${convertedMovies.length} movies by ${field} (${direction})`);
          }

          setMovies(convertedMovies);
        } else {
          setSearchResults(null);
          setMovies([]);
        }
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults(null);
        setMovies([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [query, page, filters.genres, filters.releaseYearFrom, filters.releaseYearTo, filters.country, filters.minRating, filters.maxRating, filters.sortBy, filters.mediaType, hasQuery, hasFilters]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Movie Search</h1>
              <p className="text-gray-600">Find your next favorite movie</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl">
            <SearchBar
              placeholder="Search for movies, actors, or directors..."
              className="w-full"
            />
          </div>
        </div>

        {/* Horizontal Filter Panel - Always visible */}
        <HorizontalFilterPanel
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />

        {/* Info message when showing popular movies */}
        {!hasQuery && !hasFilters && (
          <Card className="mb-6 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <Film className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                    🎬 Discover Popular Movies
                  </h3>
                  <p className="text-sm text-gray-700 mb-3">
                    Currently showing the most popular movies. Use filters below to customize your search:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-blue-500">🎭</span>
                      <span>Select genres</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-purple-500">📅</span>
                      <span>Filter by year</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-yellow-500">⭐</span>
                      <span>Set minimum rating</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-green-500">🌍</span>
                      <span>Choose country</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Searching for movies...</p>
          </div>
        ) : searchResults && movies.length === 0 ? (
          <NoResults query={query} filters={filters} />
        ) : searchResults && movies.length > 0 ? (
          <>
            {/* Results Summary */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                  <span className="flex items-center gap-2">
                    <Film className="w-5 h-5" />
                    {query 
                      ? `Search Results for "${query}"` 
                      : hasFilters 
                      ? "Filtered Movies" 
                      : "Popular Movies"}
                  </span>
                  <div className="flex items-center gap-3">
                    {/* Sorting indicator */}
                    {filters.sortBy && (
                      <span className="text-xs font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1">
                        {filters.sortBy.includes("popularity") && "🔥"}
                        {filters.sortBy.includes("vote_average") && "⭐"}
                        {filters.sortBy.includes("release_date") && "📅"}
                        Sorted: {
                          filters.sortBy.includes("popularity") ? "Popularity" :
                          filters.sortBy.includes("vote_average") ? "Rating" :
                          filters.sortBy.includes("release_date") ? "Date" :
                          "Custom"
                        }
                        {filters.sortBy.includes(".asc") ? " ↑" : " ↓"}
                      </span>
                    )}
                    <span className="text-sm font-normal text-gray-500 flex items-center gap-1">
                      <span className="font-semibold text-blue-600">{searchResults.total_results}</span>
                      movies
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span>
                    Showing page {page} of {searchResults.total_pages}
                  </span>
                  <span>
                    Results {(page - 1) * 20 + 1}-
                    {Math.min(page * 20, searchResults.total_results)} of {searchResults.total_results}
                  </span>
                </div>
                
                {/* Active Filters Summary */}
                {(filters.genres?.length || filters.releaseYearFrom || filters.releaseYearTo || 
                  filters.country || filters.minRating || 
                  (filters.sortBy && filters.sortBy !== "popularity.desc")) && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Applied filters:</p>
                    <div className="flex flex-wrap gap-2">
                      {filters.genres && filters.genres.length > 0 && (
                        <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                          {filters.genres.length} genre{filters.genres.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {(filters.releaseYearFrom || filters.releaseYearTo) && (
                        <span className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-md border border-purple-200">
                          {filters.releaseYearFrom && filters.releaseYearTo 
                            ? `${filters.releaseYearFrom}-${filters.releaseYearTo}`
                            : filters.releaseYearFrom 
                            ? `from ${filters.releaseYearFrom}`
                            : `until ${filters.releaseYearTo}`}
                        </span>
                      )}
                      {filters.country && (
                        <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-md border border-green-200">
                          {COUNTRIES.find(c => c.code === filters.country)?.name || filters.country}
                        </span>
                      )}
                      {filters.minRating && (
                        <span className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700 rounded-md border border-yellow-200">
                          {filters.minRating}+ ⭐
                        </span>
                      )}
                      {filters.sortBy && filters.sortBy !== "popularity.desc" && (
                        <span className="text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded-md border border-gray-200">
                          {filters.sortBy.includes("popularity") ? "By Popularity" :
                           filters.sortBy.includes("vote_average") ? "By Rating" :
                           filters.sortBy.includes("release_date") ? "By Date" : "Custom Sort"}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Movie Grid */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {movies.map((movie) => (
                    <MovieItem
                      key={movie.id}
                      movie={movie}
                      userId={userId}
                      profile={profile}
                      variant="single"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pagination */}
            {searchResults.total_pages > 1 && (
              <div className="flex items-center justify-center gap-4">
                {page > 1 && (
                  <Button asChild variant="outline">
                    <Link
                      href={buildUrl(page - 1)}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Previous
                    </Link>
                  </Button>
                )}

                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {page} of {searchResults.total_pages}
                </span>

                {page < searchResults.total_pages && (
                  <Button asChild variant="outline">
                    <Link
                      href={buildUrl(page + 1)}
                      className="flex items-center gap-2"
                    >
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
