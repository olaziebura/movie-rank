import { auth0 } from "@/lib/auth/auth0";
import { getProfile } from "@/lib/supabase/profiles";
import Link from "next/link";
import { getMovieDetails } from "@/lib/tmdb/movies";
import { Wishlist } from "@/components/Wishlist";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Search, Film, ArrowLeft, ArrowRight, Star } from "lucide-react";
import type { Movie } from "@/types/movie";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Wishlist | MovieRank",
  description: "Your personal movie wishlist - movies you want to watch",
};

// Empty wishlist component
function EmptyWishlist() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-2xl mx-auto text-center border-dashed border-2 border-gray-300 animate-fade-in">
        <CardHeader className="pb-4">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-pink-100 to-red-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <Heart className="w-12 h-12 text-gray-400 animate-bounce" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Your Wishlist is Empty
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-8">
          <p className="text-gray-600 mb-8 text-lg leading-relaxed">
            Start building your movie collection! Add movies you want to watch
            and never forget about that perfect film you discovered.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="flex flex-col items-center p-4 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 hover:scale-110 transition-transform">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Discover</h3>
              <p className="text-sm text-gray-600 text-center">
                Browse movies and find your next favorite
              </p>
            </div>

            <div className="flex flex-col items-center p-4 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3 hover:scale-110 transition-transform">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Save</h3>
              <p className="text-sm text-gray-600 text-center">
                Click the heart icon to add movies to your wishlist
              </p>
            </div>

            <div className="flex flex-col items-center p-4 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3 hover:scale-110 transition-transform">
                <Film className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Watch</h3>
              <p className="text-sm text-gray-600 text-center">
                Keep track of movies you want to watch later
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="hover:scale-105 transition-transform"
            >
              <Link href="/" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Discover Movies
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              size="lg"
              className="hover:scale-105 transition-transform"
            >
              <Link href="/profile" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                View Profile
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Login required component
function LoginRequired() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Access Your Wishlist</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-6">
            Please log in to view and manage your personal movie wishlist.
          </p>
          <Button asChild className="w-full">
            <Link href="/auth/login">Log In</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function WishlistPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const session = await auth0.getSession();

  if (!session) {
    return <LoginRequired />;
  }

  const userId = session.user.sub ?? session.user.id;
  
  let profile = null;
  try {
    profile = await getProfile(userId);
  } catch (e) {
    console.error("Failed to fetch profile in WishlistPage:", e);
    // Continue with null profile
  }
  
  const wishlist = profile?.wishlist ?? [];

  if (!wishlist.length) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
              <p className="text-gray-600">Movies you want to watch</p>
            </div>
          </div>
          <EmptyWishlist />
        </div>
      </div>
    );
  }

  // Pagination logic
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams?.page ?? "1", 10);
  const itemsPerPage = 12; // Increased from 5 for better grid layout
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;

  const allWishlistMoviesDetails = await Promise.all(
    wishlist.map((movieId: number) => getMovieDetails(movieId))
  );

  // Convert MovieDetails to Movie type and filter out null values
  const allWishlistMovies: Movie[] = allWishlistMoviesDetails
    .filter((movie): movie is NonNullable<typeof movie> => movie !== null)
    .map((movieDetails) => ({
      id: movieDetails.id,
      title: movieDetails.title,
      poster_path: movieDetails.poster_path,
      vote_average: movieDetails.vote_average,
      release_date: movieDetails.release_date,
      vote_count: movieDetails.vote_count,
      overview: movieDetails.overview,
      genres: movieDetails.genres.map((g) => g.id),
      popularity: movieDetails.popularity,
    }));

  const totalMovies = allWishlistMovies.length;
  const totalPages = Math.ceil(totalMovies / itemsPerPage);
  const displayedMovies = allWishlistMovies.slice(start, end);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
              <p className="text-gray-600">
                {totalMovies} {totalMovies === 1 ? "movie" : "movies"} saved
              </p>
            </div>
          </div>

          <Button asChild variant="outline">
            <Link href="/" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Add More Movies
            </Link>
          </Button>
        </div>

        {/* Stats Card */}
        <Card className="mb-8">
          <CardContent className="py-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {totalMovies}
                </div>
                <div className="text-sm text-gray-600">
                  {totalMovies === 1 ? "Movie Saved" : "Movies Saved"}
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {totalPages}
                </div>
                <div className="text-sm text-gray-600">
                  {totalPages === 1 ? "Page" : "Pages"}
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {Math.round((totalMovies / 100) * 100) || 1}%
                </div>
                <div className="text-sm text-gray-600">Collection Growth</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Movies Grid */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="w-5 h-5" />
              Your Movies
              {totalPages > 1 && (
                <span className="text-sm font-normal text-gray-500">
                  (Page {page} of {totalPages})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Wishlist displayedMovies={displayedMovies} />
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4">
            {page > 1 && (
              <Button asChild variant="outline">
                <Link
                  href={`?page=${page - 1}`}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </Link>
              </Button>
            )}

            <span className="px-4 py-2 text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>

            {page < totalPages && (
              <Button asChild variant="outline">
                <Link
                  href={`?page=${page + 1}`}
                  className="flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
