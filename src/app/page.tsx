import { getPopularMovies, getTrendingMovies, getUpcomingMovies } from "@/lib/tmdb/movies";
import { auth0 } from "@/lib/auth/auth0";
import {
  getProfile,
  upsertProfileFromAuth0Session,
} from "@/lib/supabase/profiles";
import { Hero } from "@/components/homepage/Hero";

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

  // Fetch upcoming movies for the upcoming carousel (multiple pages for better selection)
  const upcomingPromises = [
    getUpcomingMovies(1).catch(() => ({ results: [], total_pages: 0, total_results: 0, page: 1 })),
    getUpcomingMovies(2).catch(() => ({ results: [], total_pages: 0, total_results: 0, page: 2 })),
    getUpcomingMovies(3).catch(() => ({ results: [], total_pages: 0, total_results: 0, page: 3 })),
  ];

  const upcomingResponses = await Promise.all(upcomingPromises);
  const allUpcomingMovies = upcomingResponses.flatMap(response => response.results);

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today

  // Remove duplicates from upcoming movies
  const uniqueUpcomingMap = new Map();
  allUpcomingMovies.forEach(movie => {
    if (!uniqueUpcomingMap.has(movie.id)) {
      uniqueUpcomingMap.set(movie.id, movie);
    }
  });

  const upcomingMovies = Array.from(uniqueUpcomingMap.values())
    .filter((movie) => {
      if (!movie.release_date) return false;
      const releaseDate = new Date(movie.release_date);
      return releaseDate >= today; // Include today and future releases
    })
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
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0)) // Sort by popularity
    .slice(0, 10); // Take top 10 most popular

  return (
    <main>
      <Hero 
        session={session} 
        profile={profile} 
        popularMovies={sortedResults}
        trendingMovies={trendingMovies}
        upcomingMovies={upcomingMovies}
      />
    </main>
  );
}
