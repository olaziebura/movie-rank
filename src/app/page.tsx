import { getPopularMovies } from "@/lib/tmdb/movies";
import { auth0 } from "@/lib/auth/auth0";
import {
  getProfile,
  upsertProfileFromAuth0Session,
} from "@/lib/supabase/profiles";
import { Hero } from "@/components/homepage/Hero";
import { UpcomingMoviesCarousel } from "@/components/homepage/UpcomingMoviesCarousel";

export default async function HomePage() {
  const session = await auth0.getSession();
  const userId = session?.user.sub ?? session?.user.id;
  
  let profile = null;
  if (userId) {
    profile = await getProfile(userId).catch(() => null);
  }

  if (session) {
    await upsertProfileFromAuth0Session(session).catch(() => null);
  }

  const { results } = await getPopularMovies(1);
  const sortedResults = [...results].sort(
    (a, b) => b.popularity - a.popularity
  );

  return (
    <main>
      <Hero session={session} profile={profile} popularMovies={sortedResults} />
      <UpcomingMoviesCarousel />
    </main>
  );
}
