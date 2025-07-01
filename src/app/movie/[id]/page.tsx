import { getMovieDetails } from "@/lib/tmdb/movies";
import { auth0 } from "@/lib/auth/auth0";
import {
  upsertProfileFromAuth0Session,
  getProfile,
} from "@/lib/supabase/profiles";
import Image from "next/image";
import { WishlistButton } from "@/components/WishlistButton";
interface MoviePageProps {
  params: {
    id: string;
  };
}

export default async function MoviePage({ params }: MoviePageProps) {
  const resolvedParams = await params;
  const movieId = parseInt(resolvedParams.id, 10);
  const movie = await getMovieDetails(movieId);

  if (!movie) {
    return <div>Movie not found</div>;
  }

  const session = await auth0.getSession();
  const userId =
    session?.user?.org_id ?? session?.user?.sub ?? session?.user?.id;

  // Ensure user profile exists if user is logged in
  let userProfile = null;
  let isMovieInWishlist = false;

  if (session && userId) {
    try {
      await upsertProfileFromAuth0Session(session);

      // Get user profile to check if movie is in wishlist
      userProfile = await getProfile(userId);
      isMovieInWishlist = userProfile?.wishlist?.includes(movieId) ?? false;
    } catch (error) {
      console.error("Failed to upsert profile on movie details page:", error);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Image
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={movie.title}
            width={500}
            height={750}
            className="w-full rounded-lg shadow-lg"
          />
        </div>

        <div className="md:col-span-2">
          <h1 className="text-4xl font-bold mb-4">{movie.title}</h1>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-lg">⭐ {movie.vote_average.toFixed(1)}</span>
            <span className="text-gray-600">{movie.release_date}</span>
            <span className="text-gray-600">{movie.runtime} min</span>
          </div>

          {session && userId && (
            <WishlistButton
              movieId={movieId}
              userId={userId}
              initialIsInWishlist={isMovieInWishlist}
            />
          )}

          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Overview</h2>
            <p className="text-gray-700 leading-relaxed">{movie.overview}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Genres</h3>
            <div className="flex flex-wrap gap-2">
              {movie.genres?.map((genre: { id: number; name: string }) => (
                <span
                  key={genre.id}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
