"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Film, Loader2, FolderOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Movie } from "@/types/movie";
import Link from "next/link";
import Image from "next/image";

interface WishlistMoviesClientProps {
  wishlistId: string;
}

export function WishlistMoviesClient({
  wishlistId,
}: WishlistMoviesClientProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingMovieId, setDeletingMovieId] = useState<number | null>(null);

  const fetchWishlistMovies = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/wishlists/${wishlistId}/items`);

      if (!response.ok) {
        throw new Error("Failed to fetch wishlist movies");
      }

      const data = await response.json();
      setMovies(data.movies || []);
    } catch (error) {
      console.error("Error fetching wishlist movies:", error);
      toast.error("Failed to load movies");
    } finally {
      setIsLoading(false);
    }
  }, [wishlistId]);

  useEffect(() => {
    fetchWishlistMovies();
  }, [fetchWishlistMovies]);

  const handleDeleteMovie = async (movieId: number) => {
    try {
      setDeletingMovieId(movieId);
      
      const response = await fetch(`/api/wishlists/${wishlistId}/items`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ movieId }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove movie");
      }

      // Remove movie from local state
      setMovies((prevMovies) => prevMovies.filter((m) => m.id !== movieId));
      toast.success("Movie removed from wishlist");
    } catch (error) {
      console.error("Error removing movie:", error);
      toast.error("Failed to remove movie");
    } finally {
      setDeletingMovieId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-2xl mx-auto text-center border-dashed border-2 border-gray-300">
          <CardHeader className="pb-4">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-pink-100 to-red-100 rounded-full flex items-center justify-center mb-4">
              <FolderOpen className="w-12 h-12 text-gray-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              No Movies Yet
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-8">
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">
              This wishlist is empty. Start adding movies to organize your collection!
            </p>
            <Button asChild>
              <Link href="/search" className="flex items-center gap-2">
                <Film className="w-4 h-4" />
                Browse Movies
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">
          {movies.length} {movies.length === 1 ? "movie" : "movies"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Film className="w-5 h-5" />
            Movies in this wishlist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {movies.map((movie) => (
              <div key={movie.id} className="group relative flex flex-col">
                {/* Movie Card */}
                <Link
                  href={`/movie/${movie.id}`}
                  className="block relative rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-200"
                >
                  {movie.poster_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                      width={500}
                      height={750}
                      className="w-full h-auto object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-gray-200 flex items-center justify-center">
                      <Film className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Desktop hover delete button */}
                  <div className="hidden lg:block">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteMovie(movie.id);
                      }}
                      disabled={deletingMovieId === movie.id}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg disabled:opacity-50"
                      title="Remove from wishlist"
                    >
                      {deletingMovieId === movie.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </Link>

                {/* Mobile/Tablet delete button (always visible) */}
                <div className="lg:hidden mt-2">
                  <Button
                    onClick={() => handleDeleteMovie(movie.id)}
                    disabled={deletingMovieId === movie.id}
                    variant="destructive"
                    size="sm"
                    className="w-full flex items-center justify-center gap-2"
                  >
                    {deletingMovieId === movie.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Removing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
