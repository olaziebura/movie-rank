"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MovieRecord } from "@/types/movie";

type Recommendation = {
  movie: MovieRecord;
  reasoning: string;
  score: number;
};

type DatabaseStats = {
  totalMovies: number;
  lastUpdate: string | null;
  syncStatus: {
    isRunning: boolean;
    lastSync: string | null;
    nextSyncDue: string;
  };
  healthy: boolean;
};

export function AIMovieRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);

  useEffect(() => {
    fetchDatabaseStats();
  }, []);

  const fetchDatabaseStats = async () => {
    try {
      const response = await fetch("/api/movies/sync");
      const data = await response.json();
      setDbStats(data);
    } catch (error) {
      console.error("Failed to fetch database stats:", error);
    }
  };

  const getRecommendations = async (
    type: "action" | "comedy" | "drama" | "romantic"
  ) => {
    setLoading(true);
    setError(null);
    try {
      const genreMap = {
        action: [28, 12, 878], // Action, Adventure, Sci-Fi
        comedy: [35], // Comedy
        drama: [18], // Drama
        romantic: [10749], // Romance
      };

      const response = await fetch("/api/movies/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userPreferences: {
            genres: genreMap[type],
            minRating: 6.5,
          },
          mood:
            type === "romantic"
              ? "romantic evening"
              : type === "action"
              ? "thrilling adventure"
              : type === "comedy"
              ? "light and fun"
              : "thoughtful and engaging",
          maxMovies: 5,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setRecommendations(data.recommendations);
      } else {
        setError(data.error || "Failed to get recommendations");
        console.error("Failed to get recommendations:", data.error);
      }
    } catch (error) {
      const errorMessage = "Error fetching recommendations. Please try again.";
      setError(errorMessage);
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const triggerManualSync = async () => {
    try {
      const response = await fetch("/api/movies/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ force: true, maxPages: 2 }),
      });

      const data = await response.json();
      console.log("Manual sync result:", data);
      await fetchDatabaseStats(); // Refresh stats
    } catch (error) {
      console.error("Manual sync failed:", error);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">AI Movie Recommendations</h1>
        <p className="text-gray-600">
          Powered by OpenAI GPT-4o and TMDB database
        </p>
      </div>

      {/* Database Stats */}
      {dbStats && (
        <Card>
          <CardHeader>
            <CardTitle>Database Status</CardTitle>
            <CardDescription>Current movie database statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Movies</p>
                <p className="text-2xl font-bold">{dbStats.totalMovies}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Update</p>
                <p className="text-sm">
                  {dbStats.lastUpdate
                    ? new Date(dbStats.lastUpdate).toLocaleDateString()
                    : "Never"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sync Status</p>
                <p className="text-sm">
                  {dbStats.syncStatus?.isRunning ? "Running" : "Idle"}
                </p>
              </div>
              <div>
                <Button onClick={triggerManualSync} size="sm">
                  Manual Sync
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendation Buttons */}
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold">Get Recommendations</h2>
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            onClick={() => getRecommendations("action")}
            disabled={loading}
            variant="outline"
          >
            Action & Adventure
          </Button>
          <Button
            onClick={() => getRecommendations("comedy")}
            disabled={loading}
            variant="outline"
          >
            Comedy
          </Button>
          <Button
            onClick={() => getRecommendations("drama")}
            disabled={loading}
            variant="outline"
          >
            Drama
          </Button>
          <Button
            onClick={() => getRecommendations("romantic")}
            disabled={loading}
            variant="outline"
          >
            Romance
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-red-800 font-medium">⚠️ Error</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            AI is analyzing movies and generating recommendations...
          </p>
        </div>
      )}

      {recommendations && recommendations.length > 0 && !loading && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-center">
            Your Personalized Recommendations
          </h2>
          <div className="grid gap-6">
            {recommendations.map((rec, index) => (
              <Card key={rec.movie.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex">
                    {rec.movie.poster_path && (
                      <Image
                        src={`https://image.tmdb.org/t/p/w200${rec.movie.poster_path}`}
                        alt={rec.movie.title}
                        width={128}
                        height={192}
                        className="w-32 h-48 object-cover"
                      />
                    )}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold">
                            {rec.movie.title}
                          </h3>
                          <p className="text-sm text-gray-500 mb-2">
                            {new Date(rec.movie.release_date).getFullYear()} •
                            ⭐ {rec.movie.vote_average.toFixed(1)}/10 • AI
                            Score: {rec.score}/10
                          </p>
                        </div>
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                          #{index + 1}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3 line-clamp-3">
                        {rec.movie.overview}
                      </p>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm font-medium text-gray-600">
                          Why we recommend this:
                        </p>
                        <p className="text-sm text-gray-800">{rec.reasoning}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
