"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { searchMovies } from "@/lib/tmdb/movies";
import { MovieItem } from "../MovieItem";
import type { Movie } from "@/types/movie";

const cn = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join("");

interface MovieRecommendation {
  title: string;
  year: string;
  description: string;
  explanation: string;
}

interface RecommendationsResponse {
  recommendations: MovieRecommendation[];
}

interface TMDBSearchResults {
  [normalizedTitle: string]: {
    results: Movie[];
  };
}

export default function AiChat() {
  const [description, setDescription] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<RecommendationsResponse | null>(
    null
  );
  const [tmdbResults, setTmdbResults] = useState<TMDBSearchResults | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [tmdbLoading, setTmdbLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const searchTMDBForMovies = async (titles: string[]) => {
    const results: TMDBSearchResults = {};

    for (const title of titles) {
      // Remove any year information and clean the title for better search results
      const cleanTitle = title.replace(/\(\d{4}\)/, "").trim();
      const normalizedTitle = title.toLowerCase();

      try {
        if (!cleanTitle) {
          console.warn("Empty search title, skipping");
          continue;
        }

        const data = await searchMovies(cleanTitle);
        results[normalizedTitle] = data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error(
          `Error searching for "${cleanTitle}":`,
          error?.response?.data || error.message
        );
        // Continue with other titles even if one fails
      }
    }

    setTmdbResults(results);
    return results;
  };

  const fetchTMDBResults = async () => {
    if (!aiResponse) return;

    setTmdbLoading(true);
    try {
      const titles = aiResponse.recommendations.map(
        (movie: MovieRecommendation) => movie.title
      );
      await searchTMDBForMovies(titles);
    } catch (error) {
      setError("Failed to fetch movie details from TMDB");
      console.error(error);
    } finally {
      setTmdbLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTmdbResults(null);
    setAiResponse(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: `Based on the following description, recommend 3 movies: "${description}". 
              Return an object in JSON format: {"recommendations":[{"title":"","year":"","description": "","explanation":""}]}`,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        try {
          const parsedResult: RecommendationsResponse = JSON.parse(data.result);
          setAiResponse(parsedResult);
        } catch (e) {
          setError("Failed to parse recommendation data");
          console.error(e);
        }
      } else {
        setError(data.error || "Failed to get recommendations");
      }
    } catch (error) {
      setError("An error occurred while fetching recommendations");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col md:flex-row gap-12 w-full justify-around max-w-screen-xlg mt-8 overflow-hidden">
      <div className="relative z-10">
        <div className="flex flex-col items-center gap-4 font-bold">
          <span className="uppercase opacity-10 text-4xl">
            Looking for a movie?
          </span>
          <span className="-mt-10 z-10 text-4xl">Ask our AI assistant!</span>
        </div>

        <Card
          className={cn(
            "w-full max-w-lg flex justify-center items-center mx-auto bg-transparent border-none"
          )}
        >
          <CardContent className="w-full">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 w-full"
            >
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Example: I want a sci-fi movie with time travel and philosophical themes..."
                required
                className="min-h-42 min-w-full max-h-42 text-md resize-none bg-transparent text-neutral-50 border-yellow-500 focus:border-yellow-500 focus:ring-0"
              />
              <Button
                type="submit"
                disabled={loading}
                className="w-auto bg-yellow-500 hover:bg-yellow-600 text-black font-semibold mt-4"
              >
                {loading ? "Finding movies..." : "Get Recommendations"}
              </Button>
            </form>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="max-w-full md:max-w-1/2">
        {loading ? (
          <div>
            <h3 className="text-xl">Check out these recommendations:</h3>
            <div className="animate-pulse flex flex-col gap-4 mt-4">
              <div className="h-6 bg-neutral-700 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-neutral-600 rounded w-full mb-2"></div>
              <div className="h-4 bg-neutral-600 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-neutral-600 rounded w-1/2"></div>
            </div>
          </div>
        ) : (
          aiResponse && (
            <div>
              <h3 className="text-xl mb-2">Check out these recommendations:</h3>
              {!tmdbResults && (
                <Button
                  onClick={fetchTMDBResults}
                  disabled={tmdbLoading}
                  className="mb-4 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                >
                  {tmdbLoading
                    ? "Loading movie details..."
                    : "Get Movie Details from TMDB"}
                </Button>
              )}
              <div className="space-y-4">
                {aiResponse.recommendations.map((movie, index) => {
                  const normalizedTitle = movie.title.toLowerCase();
                  const tmdbMatch =
                    tmdbResults?.[normalizedTitle]?.results || [];

                  return (
                    <div
                      key={index}
                      className="p-4 border border-yellow-500 rounded-lg"
                    >
                      <h4 className="text-lg font-bold">
                        {movie.title} ({movie.year})
                      </h4>
                      <p className="mb-2">
                        {movie.explanation || movie.description}
                      </p>

                      {tmdbLoading && !tmdbResults && (
                        <div className="animate-pulse mt-2">
                          <div className="h-4 bg-neutral-600 rounded w-1/2 mb-2"></div>
                          <div className="h-20 bg-neutral-700 rounded w-full"></div>
                        </div>
                      )}

                      {tmdbMatch.length > 0 && (
                        <div className="mt-2">
                          <h5 className="text-sm font-semibold">
                            TMDB Results:
                          </h5>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {tmdbMatch.slice(0, 2).map((tmdbMovie) => (
                              <MovieItem key={tmdbMovie.id} movie={tmdbMovie} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
