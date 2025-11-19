"use client";

import type { Movie } from "@/types/movie";
import { MovieItem } from "../MovieItem";
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

  if (!movies || movies.length === 0) {
    return (
      <div className="mx-auto pb-10 p-4">
        <h2 className="text-2xl font-bold mb-4">No movies available</h2>
        <p className="text-lg text-gray-600">Please check back later.</p>
      </div>
    );
  }

  // Filter released movies and sort by popularity
  const releasedMovies = movies
    .filter((m) => new Date(m.release_date) <= new Date())
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

  const displayedMovies = releasedMovies.slice(0, 15);
  const hasMore = releasedMovies.length > 15;

  return (
    <div className="mx-auto pb-10 p-4">
      <h2 className="text-3xl font-bold mb-6">Popular Movies</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
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
      
      {hasMore && (
        <div className="mt-6 text-center">
          <a
            href="/search?sortBy=popularity.desc"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            View All {releasedMovies.length} Popular Movies
          </a>
        </div>
      )}
    </div>
  );
};
