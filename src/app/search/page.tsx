import { searchMovies } from "@/lib/tmdb/movies";
import { SearchBar } from "@/components/SearchBar";
import { SearchSuggestions } from "@/components/SearchSuggestions";
import { MovieItem } from "@/components/MovieItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, ArrowLeft, ArrowRight, Film } from "lucide-react";
import type { Movie } from "@/types/movie";
import type { Metadata } from "next";
import { auth0 } from "@/lib/auth/auth0";
import { getProfile } from "@/lib/supabase/profiles";

type SearchPageProps = {
  searchParams?: Promise<{
    q?: string;
    page?: string;
  }>;
};

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams?.q || "";
  return {
    title: query
      ? `Search results for "${query}" | MovieRank`
      : "Search Movies | MovieRank",
    description: query
      ? `Find movies matching "${query}" in our extensive movie database.`
      : "Search through thousands of movies to find your next favorite film.",
  };
}

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
function NoResults({ query }: { query: string }) {
  return (
    <div className="text-center py-16">
      <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Film className="w-12 h-12 text-gray-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        No movies found for &ldquo;{query}&rdquo;
      </h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Try adjusting your search terms or browse our popular movies instead.
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

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const session = await auth0.getSession();
  const userId = session?.user?.sub || session?.user?.id;
  const profile = userId ? await getProfile(userId) : null;

  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams?.q || "";
  const page = parseInt(resolvedSearchParams?.page || "1", 10);

  let searchResults = null;
  let movies: Movie[] = [];

  if (query.trim()) {
    try {
      searchResults = await searchMovies(query, page);

      // Convert TMDBMovie to Movie type
      movies = searchResults.results.map((movie) => ({
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
    } catch (error) {
      console.error("Search failed:", error);
    }
  }

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

        {/* Content */}
        {!query.trim() ? (
          <>
            <EmptySearchState />
            <SearchSuggestions className="mt-8" />
          </>
        ) : searchResults && movies.length === 0 ? (
          <NoResults query={query} />
        ) : searchResults && movies.length > 0 ? (
          <>
            {/* Results Summary */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Film className="w-5 h-5" />
                    Search Results for &ldquo;{query}&rdquo;
                  </span>
                  <span className="text-sm font-normal text-gray-500">
                    {searchResults.total_results} movies found
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    Showing page {page} of {searchResults.total_pages}
                  </span>
                  <span>
                    Results {(page - 1) * 20 + 1}-
                    {Math.min(page * 20, searchResults.total_results)}
                    of {searchResults.total_results}
                  </span>
                </div>
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
                      session={session}
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
                      href={`/search?q=${encodeURIComponent(query)}&page=${
                        page - 1
                      }`}
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
                      href={`/search?q=${encodeURIComponent(query)}&page=${
                        page + 1
                      }`}
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
        ) : (
          // Loading or error state
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Searching for movies...</p>
          </div>
        )}
      </div>
    </div>
  );
}
