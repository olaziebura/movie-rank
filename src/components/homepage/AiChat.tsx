"use client";

import { useState, FormEvent, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import type { MovieRecord } from "@/types/movie";

interface MovieRecommendation {
  movie: MovieRecord;
  reasoning: string;
  score: number;
}

interface RecommendationsResponse {
  success: boolean;
  recommendations: MovieRecommendation[];
  explanation: string;
  totalMoviesConsidered: number;
}

/**
 * AI-powered movie recommendation chat component.
 * Allows users to describe what they're looking for and get personalized movie recommendations.
 */
export default function AiChat() {
  const [description, setDescription] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<RecommendationsResponse | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!description.trim()) {
        setError("Please describe what kind of movie you're looking for.");
        return;
      }

      setLoading(true);
      setError("");
      setAiResponse(null);

      try {
        const res = await fetch("/api/movies/recommendations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customPrompt: description,
            userPreferences: {
              minRating: 6.0, // Set a reasonable minimum rating
            },
            maxMovies: 3,
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          // Handle nested data structure from API
          const responseData = data.data || data;
          setAiResponse(responseData);
        } else {
          const errorMessage =
            data.message || data.error || "Failed to get recommendations";
          setError(errorMessage);
        }
      } catch (error) {
        console.error("Error fetching recommendations:", error);
        setError(
          "An error occurred while fetching recommendations. Please try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [description]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setDescription(e.target.value);
      if (error) setError(""); // Clear error when user starts typing
    },
    [error]
  );

  return (
    <div className="relative flex flex-col lg:flex-row gap-12 w-full justify-around max-w-7xl mt-8 overflow-hidden">
      {/* Input Section */}
      <div className="relative z-10 flex-1">
        <div className="flex flex-col items-center gap-4 font-bold">
          <span className="uppercase opacity-10 text-4xl text-center">
            Looking for a movie?
          </span>
          <span className="-mt-10 z-10 text-4xl text-center">
            Ask our AI assistant!
          </span>
        </div>

        <Card className="w-full max-w-lg mx-auto bg-transparent border-none">
          <CardContent className="w-full">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 w-full"
            >
              <Textarea
                value={description}
                onChange={handleInputChange}
                placeholder="Example: I want a sci-fi movie with time travel and philosophical themes, something like Inception but not too complex..."
                required
                minLength={10}
                maxLength={500}
                className="min-h-[120px] text-md resize-none bg-transparent text-neutral-50 border-yellow-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 placeholder:text-neutral-400"
              />
              <Button
                type="submit"
                disabled={loading || !description.trim()}
                className="w-auto bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-500/50 text-black font-semibold mt-4 transition-colors"
              >
                {loading ? "Finding movies..." : "Get Recommendations"}
              </Button>
            </form>

            {error && (
              <Alert
                variant="destructive"
                className="mt-4 bg-red-900/20 border-red-500"
              >
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      <div className="flex-1 max-w-full lg:max-w-2xl">
        {loading ? (
          <LoadingState />
        ) : aiResponse ? (
          <RecommendationResults response={aiResponse} />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

/**
 * Loading state component
 */
function LoadingState() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">
        Finding perfect movies for you...
      </h3>
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-neutral-700 rounded w-1/2"></div>
        <div className="space-y-2">
          <div className="h-4 bg-neutral-600 rounded w-full"></div>
          <div className="h-4 bg-neutral-600 rounded w-3/4"></div>
          <div className="h-4 bg-neutral-600 rounded w-1/2"></div>
        </div>
        <div className="flex gap-4">
          <div className="w-16 h-24 bg-neutral-600 rounded"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-neutral-600 rounded w-3/4"></div>
            <div className="h-4 bg-neutral-600 rounded w-1/2"></div>
            <div className="h-3 bg-neutral-700 rounded w-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <div className="text-center py-12 text-neutral-400">
      <div className="text-6xl mb-4">🎬</div>
      <h3 className="text-lg font-medium mb-2">
        Ready to discover your next favorite movie?
      </h3>
      <p className="text-sm">
        Describe what you&apos;re in the mood for, and our AI will find the
        perfect recommendations for you.
      </p>
    </div>
  );
}

function RecommendationResults({
  response,
}: {
  response: RecommendationsResponse;
}) {
  // Safety check for recommendations array
  if (!response.recommendations || !Array.isArray(response.recommendations)) {
    return (
      <div className="text-center py-8 text-red-400">
        <p>
          No recommendations found. Please try again with a different request.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">
          AI Recommendations for you:
        </h3>
        <p className="text-sm text-gray-300 mb-4">{response.explanation}</p>
      </div>

      <div className="space-y-6">
        {response.recommendations.map((recommendation, index) => (
          <RecommendationCard
            key={recommendation.movie.id}
            recommendation={recommendation}
            index={index}
          />
        ))}
      </div>

      <div className="mt-6 text-xs text-gray-400 text-center">
        Analyzed {response.totalMoviesConsidered} movies to find these perfect
        matches
      </div>
    </div>
  );
}

/**
 * Individual recommendation card component
 */
function RecommendationCard({
  recommendation,
  index,
}: {
  recommendation: MovieRecommendation;
  index: number;
}) {
  return (
    <div className="bg-neutral-700/50 rounded-lg p-4 hover:bg-neutral-700/70 transition-colors">
      <div className="flex items-start gap-4">
        {recommendation.movie.poster_path && (
          <Image
            src={`https://image.tmdb.org/t/p/w200${recommendation.movie.poster_path}`}
            alt={`${recommendation.movie.title} poster`}
            width={64}
            height={96}
            className="w-16 h-24 object-cover rounded shadow-md"
            loading={index === 0 ? "eager" : "lazy"}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h4 className="text-lg font-semibold text-white truncate">
              {recommendation.movie.title}
            </h4>
            <span className="text-yellow-400 text-sm flex items-center gap-1">
              ⭐ {recommendation.movie.vote_average.toFixed(1)}
            </span>
            <span className="text-blue-400 text-sm">
              AI Score: {recommendation.score}/10
            </span>
          </div>

          <p className="text-sm text-gray-300 mb-2">
            {new Date(recommendation.movie.release_date).getFullYear()}
          </p>

          {recommendation.movie.overview && (
            <p className="text-sm text-gray-200 mb-3 line-clamp-2">
              {recommendation.movie.overview}
            </p>
          )}

          <div className="bg-neutral-800/50 p-3 rounded">
            <p className="text-xs text-yellow-400 font-medium mb-1">
              Why we recommend this:
            </p>
            <p className="text-sm text-gray-300">{recommendation.reasoning}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
