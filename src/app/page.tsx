import { getPopularMovies, getTrendingMovies } from "@/lib/tmdb/movies";
import { auth0 } from "@/lib/auth/auth0";
import {
  getProfile,
  upsertProfileFromAuth0Session,
} from "@/lib/supabase/profiles";
import { Hero } from "@/components/homepage/Hero";
import { TopPopularMovies } from "@/components/homepage/TopPopularMovies";

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

  // Fetch multiple pages of popular movies to have more data for filtering
  const popularMoviesPromises = [
    getPopularMovies(1),
    getPopularMovies(2),
    getPopularMovies(3),
    getPopularMovies(4),
    getPopularMovies(5),
  ];

  const popularMoviesResponses = await Promise.all(popularMoviesPromises);
  
  // Combine all results from multiple pages
  const allPopularMovies = popularMoviesResponses.flatMap(response => response.results);
  
  // Remove duplicates by movie ID
  const uniqueMoviesMap = new Map();
  allPopularMovies.forEach(movie => {
    if (!uniqueMoviesMap.has(movie.id)) {
      uniqueMoviesMap.set(movie.id, movie);
    }
  });
  
  // Map to the correct format with genres and sort by popularity
  const sortedResults = Array.from(uniqueMoviesMap.values())
    .map((movie) => ({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
      vote_count: movie.vote_count,
      overview: movie.overview,
      genres: movie.genre_ids || [],
      popularity: movie.popularity,
    }))
    .sort((a, b) => b.popularity - a.popularity);

  // Fetch trending movies for the carousel
  const trendingData = await getTrendingMovies("day").catch(() => ({
    results: [],
    total_pages: 0,
    total_results: 0,
    page: 1,
  }));

  const trendingMovies = trendingData.results.map((movie) => ({
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

  return (
    <main>
      <Hero 
        session={session} 
        profile={profile} 
        popularMovies={sortedResults}
        trendingMovies={trendingMovies}
      />
    </main>
  );
}
