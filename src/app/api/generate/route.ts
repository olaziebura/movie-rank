import openai from "@/lib/openai/openai";
import { getMovieDetails } from "@/lib/tmdb/movies";

import {
  createApiResponse,
  createErrorResponse,
} from "@/lib/utils/apiResponse";
import { MovieRankError, ErrorType } from "@/lib/utils/errorHandler";
import { AI_CONFIG } from "@/lib/utils/constants";

interface GenerateRequest {
  prompt?: string;
  movieId?: number;
}

interface MovieData {
  title: string;
  overview: string;
  genres: Array<{ name: string }>;
}

/**
 * Generates movie reviews or recommendations using OpenAI.
 * Accepts either a custom prompt or a movie ID to generate content for.
 */
export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body: GenerateRequest = await request.json();


    // Validation
    if (!body.prompt && !body.movieId) {
      return createErrorResponse(
        "Either 'prompt' or 'movieId' is required",
        400,
        "INVALID_REQUEST"
      );
    }

    let finalPrompt = "";

    if (body.movieId) {
      const movieData = (await getMovieDetails(body.movieId)) as MovieData;

      if (!movieData) {
        return createErrorResponse("Movie not found", 404, "MOVIE_NOT_FOUND");
      }

      finalPrompt = `Na podstawie tych danych o filmie:
Tytuł: ${movieData.title}
Opis: ${movieData.overview}
Gatunki: ${movieData.genres?.map((g) => g.name).join(", ") || "Brak informacji"}

Napisz zwięzłą recenzję filmu w stylu eksperta filmowego oraz zasugeruj, komu szczególnie może się spodobać.`;
    } else if (body.prompt) {
      finalPrompt = body.prompt;
    }

    const response = await openai.chat.completions.create({
      model: AI_CONFIG.MOVIE_REVIEW_MODEL,
      messages: [
        {
          role: "system",
          content: AI_CONFIG.MOVIE_EXPERT_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: finalPrompt,
        },
      ],
      max_tokens: AI_CONFIG.MOVIE_REVIEW_MAX_TOKENS,
      temperature: AI_CONFIG.MOVIE_REVIEW_TEMPERATURE,
    });

    const result = response.choices[0]?.message?.content;

    if (!result) {
      throw new MovieRankError(
        ErrorType.EXTERNAL_API_ERROR,
        "No content generated by AI",
        500,
        "AI_NO_CONTENT"
      );
    }

    const duration = Date.now() - startTime;

    return createApiResponse({
      result,
      metadata: {
        generated_at: new Date().toISOString(),
        movie_id: body.movieId,
        duration_ms: duration,
      },
    });
  } catch (error) {
    if (error instanceof MovieRankError) {
      return createErrorResponse(
        error.message,
        error.statusCode,
        error.code || "GENERATION_ERROR"
      );
    }

    return createErrorResponse(
      "Failed to generate movie recommendation or review",
      500,
      "GENERATION_ERROR"
    );
  }
}
