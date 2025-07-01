"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import type {
  FeaturedUpcomingMovie,
  FeaturedUpcomingSortBy,
  SortOrder,
} from "@/lib/supabase/upcomingMovies";

interface FeaturedUpcomingMoviesResponse {
  success: boolean;
  movies: FeaturedUpcomingMovie[];
  count: number;
  sortBy: string;
  sortOrder: string;
  timestamp: string;
  stats?: {
    totalFeatured: number;
    lastUpdated: string | null;
    averageRating: number;
    averagePopularity: number;
    genreDistribution: { [key: number]: number };
  };
}

interface TopUpcomingMoviesProps {
  showStats?: boolean;
  className?: string;
}

export default function TopUpcomingMovies({
  showStats = false,
  className = "",
}: TopUpcomingMoviesProps) {
  const [movies, setMovies] = useState<FeaturedUpcomingMovie[]>([]);
  const [stats, setStats] = useState<FeaturedUpcomingMoviesResponse["stats"]>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [sortBy, setSortBy] = useState<FeaturedUpcomingSortBy>("rank");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [refreshing, setRefreshing] = useState(false);

  // Fetch featured upcoming movies
  const fetchMovies = async (
    sort: FeaturedUpcomingSortBy = sortBy,
    order: SortOrder = sortOrder
  ) => {
    try {
      const params = new URLSearchParams({
        sortBy: sort,
        sortOrder: order,
        includeStats: showStats.toString(),
      });

      const response = await fetch(`/api/upcoming-movies/featured?${params}`);
      const data: FeaturedUpcomingMoviesResponse = await response.json();

      if (data.success) {
        setMovies(data.movies);
        setStats(data.stats);
        setError("");
      } else {
        setError("Failed to load featured upcoming movies");
      }
    } catch (err) {
      console.error("Error fetching featured movies:", err);
      setError("Unable to connect to the movie service");
    } finally {
      setLoading(false);
    }
  };

  // Trigger manual curation
  const triggerCuration = async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/upcoming-movies/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true, maxPages: 5 }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh the list after curation
        await fetchMovies();
      } else {
        setError(`Curation failed: ${result.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error triggering curation:", err);
      setError("Failed to refresh the movie list");
    } finally {
      setRefreshing(false);
    }
  };

  // Handle sort change
  const handleSortChange = async (
    newSortBy: FeaturedUpcomingSortBy,
    newSortOrder?: SortOrder
  ) => {
    const actualSortOrder =
      newSortOrder ||
      (newSortBy === sortBy && sortOrder === "asc" ? "desc" : "asc");

    setSortBy(newSortBy);
    setSortOrder(actualSortOrder);
    setLoading(true);

    await fetchMovies(newSortBy, actualSortOrder);
  };

  // Format release date
  const formatReleaseDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return "Released";
    } else if (diffDays === 1) {
      return "Tomorrow";
    } else if (diffDays <= 7) {
      return `In ${diffDays} days`;
    } else if (diffDays <= 30) {
      return `In ${Math.ceil(diffDays / 7)} weeks`;
    } else {
      return `In ${Math.ceil(diffDays / 30)} months`;
    }
  };

  // Get rank display
  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return "🏆";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `#${rank}`;
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && movies.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">
            🎬 Top 10 Upcoming Movies Worth Waiting For
          </h2>
          <div className="animate-pulse">
            <div className="h-4 bg-neutral-700 rounded w-48 mx-auto mb-4"></div>
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-neutral-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          🎬 Top 10 Upcoming Movies Worth Waiting For
        </h2>

        {stats && (
          <div className="text-sm text-gray-400 space-y-1">
            <p>
              Last updated:{" "}
              {stats.lastUpdated
                ? new Date(stats.lastUpdated).toLocaleString()
                : "Never"}
            </p>
            <p>
              Average rating: ⭐ {stats.averageRating}/10 | Average popularity:
              📈 {stats.averagePopularity}
            </p>
          </div>
        )}

        {/* Sort Controls */}
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            variant={sortBy === "rank" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSortChange("rank")}
            className="text-xs"
          >
            Rank {sortBy === "rank" && (sortOrder === "asc" ? "↑" : "↓")}
          </Button>
          <Button
            variant={sortBy === "curation_score" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSortChange("curation_score")}
            className="text-xs"
          >
            Score{" "}
            {sortBy === "curation_score" && (sortOrder === "asc" ? "↑" : "↓")}
          </Button>
          <Button
            variant={sortBy === "vote_average" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSortChange("vote_average")}
            className="text-xs"
          >
            Rating{" "}
            {sortBy === "vote_average" && (sortOrder === "asc" ? "↑" : "↓")}
          </Button>
          <Button
            variant={sortBy === "release_date" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSortChange("release_date")}
            className="text-xs"
          >
            Release{" "}
            {sortBy === "release_date" && (sortOrder === "asc" ? "↑" : "↓")}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={triggerCuration}
            disabled={refreshing}
            className="text-xs ml-2"
          >
            {refreshing ? "Refreshing..." : "🔄 Refresh List"}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Movies List */}
      <div className="grid gap-4">
        {movies.map((movie) => (
          <Card key={movie.id} className="bg-neutral-800/50 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex gap-4">
                {/* Poster */}
                <div className="flex-shrink-0">
                  {movie.poster_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                      alt={movie.title}
                      width={80}
                      height={120}
                      className="w-20 h-30 object-cover rounded shadow-lg"
                    />
                  ) : (
                    <div className="w-20 h-30 bg-neutral-700 rounded flex items-center justify-center">
                      <span className="text-neutral-500 text-xs">No Image</span>
                    </div>
                  )}
                </div>

                {/* Movie Info */}
                <div className="flex-grow space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">
                          {getRankEmoji(movie.rank_position)}
                        </span>
                        <h3 className="text-lg font-semibold text-white">
                          {movie.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-300 mb-2">
                        <span>⭐ {movie.vote_average.toFixed(1)}/10</span>
                        <span>📈 {movie.popularity.toFixed(0)}</span>
                        <span>🎯 {movie.curation_score.toFixed(1)}</span>
                        <span className="text-yellow-400">
                          📅 {formatReleaseDate(movie.release_date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                    {movie.overview}
                  </p>

                  <div className="bg-neutral-900/50 p-2 rounded text-xs">
                    <p className="text-yellow-400 mb-1">
                      Why it&apos;s worth waiting for:
                    </p>
                    <p className="text-gray-300">{movie.curation_reasoning}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {movies.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-400">
            No upcoming movies found. Try refreshing the list!
          </p>
          <Button
            onClick={triggerCuration}
            disabled={refreshing}
            className="mt-4"
          >
            {refreshing ? "Loading..." : "🔄 Load Movies"}
          </Button>
        </div>
      )}
    </div>
  );
}
