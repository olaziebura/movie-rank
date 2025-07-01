import { getPopularMovies } from "@/lib/tmdb/movies";
import { auth0 } from "@/lib/auth/auth0";
import {
  getProfile,
  upsertProfileFromAuth0Session,
} from "@/lib/supabase/profiles";
import { PopularMovies } from "@/components/homepage/PopularMovies";
import { Hero } from "@/components/homepage/Hero";
import { UpcomingMoviesCarousel } from "@/components/homepage/UpcomingMoviesCarousel";
import { AIMovieRecommendations } from "@/components/AIMovieRecommendations";

export default async function PageWithAI() {
  const session = await auth0.getSession();
  const userId = session?.user.sub ?? session?.user.id;
  const profile = await getProfile(userId);

  if (session) {
    try {
      await upsertProfileFromAuth0Session(session);
    } catch (e) {
      console.error("Failed to upsert profile in PageWithAI:", e);
    }
  }

  const { results } = await getPopularMovies(1);
  const sortedResults = [...results].sort(
    (a, b) => b.popularity - a.popularity
  );

  return (
    <main>
      <Hero />
      <UpcomingMoviesCarousel />
      <PopularMovies
        profile={profile}
        session={session}
        movies={sortedResults}
      />
      <AIMovieRecommendations />
    </main>
  );
}
