import {
  MovieRecommendationService,
  type RecommendationRequest,
} from "@/lib/services/movieRecommendations";

import {
  createApiResponse,
  createErrorResponse,
} from "@/lib/utils/apiResponse";
import { MovieRankError } from "@/lib/utils/errorHandler";
import { RECOMMENDATIONS_CONFIG } from "@/lib/utils/constants";

/**
 * POST /api/movies/recommendations - Get AI-powered movie recommendations
 * Accepts user preferences, mood, or custom prompts to generate personalized movie recommendations.
 */
export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body: RecommendationRequest = await request.json();

    // Validate request
    if (!body.userPreferences && !body.mood && !body.customPrompt) {
      return createErrorResponse(
        "Please provide at least user preferences, mood, or custom prompt",
        400,
        "INVALID_REQUEST"
      );
    }

    // Validate maxMovies if provided
    if (
      body.maxMovies &&
      (body.maxMovies < 1 ||
        body.maxMovies > RECOMMENDATIONS_CONFIG.MAX_RECOMMENDATIONS)
    ) {
      return createErrorResponse(
        `maxMovies must be between 1 and ${RECOMMENDATIONS_CONFIG.MAX_RECOMMENDATIONS}`,
        400,
        "INVALID_MAX_MOVIES"
      );
    }

    // Generate recommendations
    const recommendations =
      await MovieRecommendationService.generateRecommendations(body);

    const duration = Date.now() - startTime;

    return createApiResponse({
      success: true,
      ...recommendations,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: duration,
        version: "1.0",
      },
    });
  } catch (error) {
    if (error instanceof MovieRankError) {
      return createErrorResponse(
        error.message,
        error.statusCode,
        error.code || "RECOMMENDATION_ERROR"
      );
    }

    return createErrorResponse(
      "Failed to generate recommendations",
      500,
      "RECOMMENDATION_ERROR"
    );
  }
}

/**
 * GET /api/movies/recommendations - Get quick recommendations by genre or mood
 * Supports query parameters: genres (comma-separated IDs), mood, count
 */
export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const genreIds = searchParams.get("genres");
    const mood = searchParams.get("mood");
    const count = Math.min(
      parseInt(
        searchParams.get("count") ||
          RECOMMENDATIONS_CONFIG.DEFAULT_RECOMMENDATIONS.toString()
      ),
      RECOMMENDATIONS_CONFIG.MAX_RECOMMENDATIONS
    );

    if (mood) {
      // Mood-based recommendations
      const recommendations =
        await MovieRecommendationService.getMoodBasedRecommendations(
          mood,
          count
        );

      const duration = Date.now() - startTime;

      return createApiResponse({
        success: true,
        type: "mood",
        mood,
        ...recommendations,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: duration,
        },
      });
    }

    if (genreIds) {
      // Genre-based recommendations
      const genres = genreIds
        .split(",")
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));

      if (genres.length === 0) {
        return createErrorResponse(
          "Invalid genre IDs provided",
          400,
          "INVALID_GENRE_IDS"
        );
      }

      const recommendations =
        await MovieRecommendationService.getQuickGenreRecommendations(
          genres,
          count
        );

      const duration = Date.now() - startTime;
      return createApiResponse({
        success: true,
        type: "genre",
        genres,
        ...recommendations,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: duration,
        },
      });
    }

    return createErrorResponse(
      "Please provide either 'genres' or 'mood' parameter",
      400,
      "MISSING_PARAMETERS"
    );
  } catch (error) {
    if (error instanceof MovieRankError) {
      return createErrorResponse(
        error.message,
        error.statusCode,
        error.code || "QUICK_RECOMMENDATION_ERROR"
      );
    }

    return createErrorResponse(
      "Failed to generate recommendations",
      500,
      "QUICK_RECOMMENDATION_ERROR"
    );
  }
}
