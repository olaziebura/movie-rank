"use client";
import type { Movie } from "@/types/movie";
import { MovieItem } from "./MovieItem";
import { useUserProfile } from "@/hooks/useUserProfile";

export type WishlistProps = {
  displayedMovies: Movie[];
};

export const Wishlist = ({ displayedMovies }: WishlistProps) => {
  const { profile, userId } = useUserProfile();

  if (displayedMovies.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No movies to display</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
      {displayedMovies.map((movie: Movie) => (
        <MovieItem 
          variant="single" 
          key={movie.id} 
          movie={movie} 
          userId={userId}
          profile={profile}
        />
      ))}
    </div>
  );
};
