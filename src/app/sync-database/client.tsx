"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SyncResult {
  success?: boolean;
  error?: string;
  message?: string;
  moviesProcessed?: number;
  timestamp?: string;
  upcomingMoviesSync?: {
    success: boolean;
    error?: string;
    message?: string;
    moviesProcessed?: number;
  };
}

interface DbStats {
  totalMovies?: number;
  lastUpdate?: string;
  healthy?: boolean;
  categories?: Record<string, number>;
}

export default function DatabaseSyncPage() {
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dbStats, setDbStats] = useState<DbStats | null>(null);
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");

  const SYNC_PASSWORD = process.env.NEXT_PUBLIC_SYNC_PASSWORD || "admin123";

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === SYNC_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError("");
      checkDatabaseStats(); 
    } else {
      setAuthError("Incorrect password. Please try again.");
    }
  };

  const triggerSync = async () => {
    setLoading(true);
    setSyncResult(null);

    try {
      const response = await fetch("/api/movies/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          force: true,
          maxPages: 5,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success !== false) {
        try {
          const upcomingResponse = await fetch(
            "/api/upcoming-movies/featured",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                force: true,
                maxPages: 4,
              }),
            }
          );

          const upcomingData = await upcomingResponse.json();

          setSyncResult({
            ...data,
            upcomingMoviesSync:
              upcomingData.success !== false
                ? {
                    success: true,
                    message:
                      upcomingData.message ||
                      "Upcoming movies refreshed successfully",
                    moviesProcessed:
                      upcomingData.moviesProcessed ||
                      upcomingData.totalProcessed,
                  }
                : {
                    success: false,
                    error:
                      upcomingData.error ||
                      upcomingData.message ||
                      "Failed to refresh upcoming movies",
                  },
          });
        } catch (upcomingError) {
          setSyncResult({
            ...data,
            upcomingMoviesSync: {
              success: false,
              error:
                upcomingError instanceof Error
                  ? upcomingError.message
                  : "Failed to refresh upcoming movies",
            },
          });
        }
      } else {
        setSyncResult(data);
      }

      await checkDatabaseStats();
    } catch (error) {
      setSyncResult({
        error:
          "Failed to sync: " +
          (error instanceof Error ? error.message : "Unknown error"),
      });
    } finally {
      setLoading(false);
    }
  };

  const checkDatabaseStats = async () => {
    try {
      const response = await fetch("/api/movies/sync");
      const data = await response.json();
      setDbStats(data);
    } catch (error) {
      console.error("Failed to get database stats:", error);
    }
  };

  const testRecommendations = async () => {
    try {
      const response = await fetch(
        "/api/movies/recommendations?genres=28,12&count=3"
      );
      const data = await response.json();
      console.log("Test recommendations:", data);
      alert("Check console for recommendations result!");
    } catch (error) {
      alert(
        "Failed to get recommendations: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  };

  useState(() => {
    checkDatabaseStats();
  });

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Movie Database Sync</h1>
        <p className="text-gray-600">
          Add movies to your database from TMDB API
        </p>
      </div>

      {}
      {!isAuthenticated ? (
        <Card className="mb-6 max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Access Required</CardTitle>
            <CardDescription>
              Please enter the admin password to access the sync functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter admin password"
                  required
                />
              </div>

              {authError && (
                <Alert className="border-red-500 bg-red-50">
                  <AlertDescription className="text-red-800">
                    {authError}
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full">
                Access Sync Panel
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          {}
          {dbStats && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Current Database Status</CardTitle>
                <CardDescription>Movie database statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Movies</p>
                    <p className="text-2xl font-bold">
                      {dbStats.totalMovies || 0}
                    </p>
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
                    <p className="text-sm text-gray-500">Health</p>
                    <p
                      className={`text-sm font-medium ${
                        dbStats.healthy ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {dbStats.healthy ? "Healthy" : "Needs Sync"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Categories</p>
                    <p className="text-sm">
                      {Object.keys(dbStats.categories || {}).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Sync Database</CardTitle>
              <CardDescription>
                This will fetch movies from TMDB API and add them to your
                database, plus refresh the upcoming movies collection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={triggerSync}
                  disabled={loading}
                  size="lg"
                  className="flex-1"
                >
                  {loading
                    ? "Syncing Databases..."
                    : "Sync All Movie Databases"}
                </Button>
                <Button
                  onClick={checkDatabaseStats}
                  variant="outline"
                  size="lg"
                >
                  Refresh Stats
                </Button>
              </div>

              {(dbStats?.totalMovies || 0) > 0 && (
                <Button
                  onClick={testRecommendations}
                  variant="secondary"
                  size="lg"
                  className="w-full"
                >
                  Test AI Recommendations
                </Button>
              )}
            </CardContent>
          </Card>

          {}
          {loading && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-lg font-medium">
                    Syncing movie databases...
                  </p>
                  <p className="text-sm text-gray-600">
                    This will sync both the main movie database and upcoming
                    movies. May take 30-90 seconds.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {}
          {syncResult && (
            <Card>
              <CardHeader>
                <CardTitle>Sync Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {}
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Main Movie Database Sync
                  </h3>
                  <div
                    className={`p-3 rounded ${
                      syncResult.error
                        ? "bg-red-50 text-red-800"
                        : "bg-green-50 text-green-800"
                    }`}
                  >
                    {syncResult.error ? (
                      <div>
                        <strong>❌ Sync Failed:</strong> {syncResult.error}
                      </div>
                    ) : (
                      <div>
                        <strong>✅ Sync Completed:</strong> {syncResult.message}
                        {syncResult.moviesProcessed && (
                          <div className="mt-1">
                            Movies processed: {syncResult.moviesProcessed}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {}
                {syncResult.upcomingMoviesSync && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Upcoming Movies Refresh
                    </h3>
                    <div
                      className={`p-3 rounded ${
                        syncResult.upcomingMoviesSync.error
                          ? "bg-red-50 text-red-800"
                          : "bg-green-50 text-green-800"
                      }`}
                    >
                      {syncResult.upcomingMoviesSync.error ? (
                        <div>
                          <strong>❌ Upcoming Movies Sync Failed:</strong>{" "}
                          {syncResult.upcomingMoviesSync.error}
                        </div>
                      ) : (
                        <div>
                          <strong>✅ Upcoming Movies Refreshed:</strong>{" "}
                          {syncResult.upcomingMoviesSync.message}
                          {syncResult.upcomingMoviesSync.moviesProcessed && (
                            <div className="mt-1">
                              Movies processed:{" "}
                              {syncResult.upcomingMoviesSync.moviesProcessed}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {}
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                    Show raw sync data (for debugging)
                  </summary>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto mt-2">
                    {JSON.stringify(syncResult, null, 2)}
                  </pre>
                </details>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
