import { auth0 } from "@/lib/auth/auth0";
import { getProfile } from "@/lib/supabase/profiles";
import Link from "next/link";
import { getMovieDetails } from "@/lib/tmdb/movies";
import { MovieItem } from "@/components/MovieItem";
import type { Movie } from "@/types/movie";

export default async function WishlistPage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const session = await auth0.getSession();
  if (!session) return <p>Please log in to see your wishlist.</p>;

  const userId = session.user.sub ?? session.user.id;
  const profile = await getProfile(userId);

  const wishlist = profile?.wishlist ?? [];
  if (!wishlist.length) return <p>Your wishlist is empty.</p>;

  const page = parseInt(searchParams?.page ?? "1", 10);
  const itemsPerPage = 5;
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;

  const allWishlistMovies = await Promise.all(
    wishlist.map((movieId: number) => getMovieDetails(movieId))
  );
  const totalMovies = allWishlistMovies.length;
  const totalPages = Math.ceil(totalMovies / itemsPerPage);
  const displayedMovies = allWishlistMovies.slice(start, end);
  return (
    <section className="flex flex-col items-start justify-center gap-8 p-4">
      <h1 className="text-2xl font-bold">Check your wishlist</h1>
      <ul className="flex gap-12">
        {displayedMovies.map((movie: Movie) => (
          <MovieItem variant="single" key={movie.id} movie={movie} />
        ))}
      </ul>
      <div style={{ display: "flex", gap: "1rem" }}>
        {page > 1 && (
          <Link href={`?page=${page - 1}`} prefetch={false}>
            Previous
          </Link>
        )}
        {page < totalPages && (
          <Link href={`?page=${page + 1}`} prefetch={false}>
            Next
          </Link>
        )}
      </div>
    </section>
  );
}
