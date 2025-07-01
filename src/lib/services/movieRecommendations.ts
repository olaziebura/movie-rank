import openai from "../openai/openai";
import { getMoviesFromDatabase } from "../supabase/movies";
import type { MovieRecord } from "@/types/movie";
import { GENRE_IDS } from "../utils/constants";

// User preference types for recommendations
export type UserPreferences = {
  genres?: number[];
  minRating?: number;
  maxRating?: number;
  categories?: string[];
  excludeGenres?: number[];
  yearRange?: {
    start?: number;
    end?: number;
  };
};

export type RecommendationRequest = {
  userPreferences?: UserPreferences;
  mood?: string;
  occasion?: string;
  customPrompt?: string;
  maxMovies?: number;
};

export type MovieRecommendation = {
  movie: MovieRecord;
  reasoning: string;
  score: number;
};

export type RecommendationResponse = {
  recommendations: MovieRecommendation[];
  explanation: string;
  totalMoviesConsidered: number;
};

// Genre keyword mapping for smart query analysis
const GENRE_KEYWORDS: Record<number, string[]> = {
  [GENRE_IDS.SCIENCE_FICTION]: [
    "sci-fi",
    "science fiction",
    "scifi",
    "space",
    "future",
    "robot",
    "alien",
    "technology",
    "cyberpunk",
  ],
  [GENRE_IDS.HORROR]: [
    "horror",
    "scary",
    "frightening",
    "terror",
    "monster",
    "zombie",
    "ghost",
    "supernatural",
  ],
  [GENRE_IDS.COMEDY]: [
    "comedy",
    "funny",
    "humor",
    "laugh",
    "hilarious",
    "amusing",
    "comic",
  ],
  [GENRE_IDS.ACTION]: [
    "action",
    "fighting",
    "battle",
    "adventure",
    "explosive",
    "superhero",
    "martial arts",
  ],
  [GENRE_IDS.DRAMA]: [
    "drama",
    "emotional",
    "serious",
    "deep",
    "moving",
    "touching",
    "character",
  ],
  [GENRE_IDS.THRILLER]: [
    "thriller",
    "suspense",
    "tension",
    "mystery",
    "crime",
    "psychological",
  ],
  [GENRE_IDS.ROMANCE]: [
    "romance",
    "romantic",
    "love",
    "relationship",
    "dating",
    "passion",
  ],
  [GENRE_IDS.FANTASY]: [
    "fantasy",
    "magic",
    "magical",
    "wizard",
    "dragon",
    "mythical",
    "epic",
  ],
  [GENRE_IDS.ANIMATION]: [
    "animation",
    "animated",
    "cartoon",
    "anime",
    "pixar",
    "disney",
  ],
  [GENRE_IDS.CRIME]: [
    "crime",
    "criminal",
    "heist",
    "police",
    "detective",
    "gangster",
  ],
  [GENRE_IDS.ADVENTURE]: [
    "adventure",
    "quest",
    "journey",
    "exploration",
    "expedition",
  ],
  [GENRE_IDS.HISTORY]: [
    "history",
    "historical",
    "period",
    "ancient",
    "biographical",
    "true story",
  ],
  [GENRE_IDS.MYSTERY]: [
    "mystery",
    "detective",
    "investigation",
    "puzzle",
    "whodunit",
  ],
  [GENRE_IDS.WAR]: [
    "war",
    "military",
    "battle",
    "soldier",
    "combat",
    "wwii",
    "vietnam",
  ],
  [GENRE_IDS.WESTERN]: [
    "western",
    "cowboy",
    "frontier",
    "old west",
    "gunfighter",
  ],
};

// Main recommendation service
export class MovieRecommendationService {
  /**
   * Smart query analysis to detect genres and preferences from natural language
   */
  private static analyzeUserQuery(query: string): UserPreferences {
    const lowerQuery = query.toLowerCase();
    const detectedGenres: number[] = [];

    // Detect genres based on keywords
    Object.entries(GENRE_KEYWORDS).forEach(([genreId, keywords]) => {
      if (keywords.some((keyword) => lowerQuery.includes(keyword))) {
        detectedGenres.push(parseInt(genreId));
      }
    });

    // Determine minimum rating based on quality keywords
    let minRating: number;
    if (
      lowerQuery.includes("best") ||
      lowerQuery.includes("top") ||
      lowerQuery.includes("greatest")
    ) {
      minRating = 7.5;
    } else if (lowerQuery.includes("good") || lowerQuery.includes("quality")) {
      minRating = 7.0;
    }

    // Determine year preferences
    let yearRange: { start?: number; end?: number } | undefined;
    if (
      lowerQuery.includes("recent") ||
      lowerQuery.includes("new") ||
      lowerQuery.includes("latest")
    ) {
      yearRange = { start: new Date().getFullYear() - 3 };
    } else if (lowerQuery.includes("classic") || lowerQuery.includes("old")) {
      yearRange = { end: 2000 };
    }

    return {
      genres: detectedGenres,
      minRating,
      yearRange,
    };
  }

  // Generate movie recommendations using OpenAI
  static async generateRecommendations(
    request: RecommendationRequest
  ): Promise<RecommendationResponse> {
    try {
      // Enhanced user preferences with smart query analysis
      let enhancedPreferences = request.userPreferences || {};

      // If user provided a mood/query, analyze it for genre detection
      if (request.mood) {
        const analyzedPreferences = this.analyzeUserQuery(request.mood);
        enhancedPreferences = {
          ...enhancedPreferences,
          ...analyzedPreferences,
          // Merge genres if both exist
          genres: [
            ...(enhancedPreferences.genres || []),
            ...(analyzedPreferences.genres || []),
          ].filter((genre, index, arr) => arr.indexOf(genre) === index), // Remove duplicates
        };
      }

      // Fetch relevant movies from database based on enhanced preferences
      const candidateMovies = await this.getCandidateMovies(
        enhancedPreferences
      );

      if (candidateMovies.length === 0) {
        throw new Error("No movies found matching your preferences");
      }

      console.log(
        `Found ${candidateMovies.length} candidate movies for analysis`
      );

      // Prepare the prompt for OpenAI
      const prompt = this.buildRecommendationPrompt(candidateMovies, request);

      // Get recommendation from OpenAI
      const aiResponse = await this.callOpenAI(prompt);

      // Parse and structure the response
      const recommendations = this.parseRecommendationResponse(
        aiResponse,
        candidateMovies
      );

      return {
        recommendations,
        explanation:
          aiResponse.explanation ||
          "AI-powered recommendations based on your preferences",
        totalMoviesConsidered: candidateMovies.length,
      };
    } catch (error) {
      console.error("Error generating recommendations:", error);
      throw error;
    }
  }

  // Fetch candidate movies based on user preferences with smart genre detection
  private static async getCandidateMovies(
    preferences: UserPreferences = {}
  ): Promise<MovieRecord[]> {
    const {
      genres,
      minRating = 6.0,
      maxRating = 10.0,
      categories,
      excludeGenres,
      yearRange,
    } = preferences;

    // Build query options
    const queryOptions = {
      minRating,
      maxRating,
      limit: 200, // Increased to get more variety for AI to choose from
      sortBy: "vote_average" as const,
      sortOrder: "desc" as const,
      ...(genres && genres.length > 0 && { genres }),
    };

    // Fetch movies
    let movies = await getMoviesFromDatabase(queryOptions);

    // If no specific genre is provided, try to get a diverse mix
    if (!genres || genres.length === 0) {
      // Get movies from all categories for better diversity
      const diverseMovies = await getMoviesFromDatabase({
        minRating: 5.5, // Lower threshold for more variety
        limit: 200,
        sortBy: "popularity" as const,
        sortOrder: "desc" as const,
      });

      // Combine and deduplicate
      const movieMap = new Map();
      [...movies, ...diverseMovies].forEach((movie) => {
        if (!movieMap.has(movie.id)) {
          movieMap.set(movie.id, movie);
        }
      });
      movies = Array.from(movieMap.values());
    }

    // Apply additional filters that aren't handled by the database query
    if (categories && categories.length > 0) {
      movies = movies.filter((movie) => categories.includes(movie.category));
    }

    if (excludeGenres && excludeGenres.length > 0) {
      movies = movies.filter(
        (movie) =>
          !movie.genres.some((genreId: number) =>
            excludeGenres.includes(genreId)
          )
      );
    }

    if (yearRange) {
      movies = movies.filter((movie) => {
        const year = new Date(movie.release_date).getFullYear();
        const afterStart = !yearRange.start || year >= yearRange.start;
        const beforeEnd = !yearRange.end || year <= yearRange.end;
        return afterStart && beforeEnd;
      });
    }

    return movies;
  }

  // Build the prompt for OpenAI with enhanced user query understanding
  private static buildRecommendationPrompt(
    movies: MovieRecord[],
    request: RecommendationRequest
  ): string {
    const { mood, occasion, customPrompt } = request;

    // Create movie summaries for the prompt with more details
    const movieSummaries = movies.slice(0, 50).map((movie) => ({
      id: movie.id,
      title: movie.title,
      overview:
        movie.overview.slice(0, 300) +
        (movie.overview.length > 300 ? "..." : ""),
      rating: movie.vote_average,
      year: new Date(movie.release_date).getFullYear(),
      category: movie.category,
      genres: movie.genres,
    }));

    let contextPrompt = "";
    if (mood) contextPrompt += `User's specific request: "${mood}"\n`;
    if (occasion) contextPrompt += `Occasion: ${occasion}\n`;
    if (customPrompt) contextPrompt += `Additional context: ${customPrompt}\n`;

    return `
You are an expert film critic and recommendation engine. The user has made a specific request, and you need to find movies that EXACTLY match their criteria from the available options.

${contextPrompt}

IMPORTANT: Pay close attention to the user's specific request. If they mention:
- Genre keywords (sci-fi, horror, comedy, action, drama, etc.) - prioritize movies from those genres
- Mood keywords (dark, funny, romantic, thrilling, etc.) - find movies that match that mood
- Specific themes or topics - search for those in the plot descriptions

Available movies to choose from:
${movieSummaries
  .map(
    (movie) =>
      `- ID: ${movie.id} | ${movie.title} (${movie.year}) - Rating: ${
        movie.rating
      }/10
    Genres: ${movie.genres.join(",")} | Category: ${movie.category}
    Plot: ${movie.overview}`
  )
  .join("\n")}

Genre ID Reference for better matching:
- 878: Science Fiction, 27: Horror, 35: Comedy, 28: Action, 18: Drama
- 53: Thriller, 10749: Romance, 14: Fantasy, 12: Adventure, 16: Animation
- 80: Crime, 9648: Mystery, 36: History, 10752: War, 37: Western

CRITICAL: You MUST respond with ONLY valid JSON in the following format. Do not include any text before or after the JSON:

{
  "explanation": "Brief explanation of how you interpreted the user's request and your selection strategy",
  "recommendations": [
    {
      "movieId": number,
      "reasoning": "Specific explanation of why this movie matches the user's request with genre/theme details",
      "score": number (1-10 representing how well it matches the user's specific request)
    }
  ]
}

Prioritize movies that directly match the user's request over general popularity. Return ONLY the JSON object, no additional text.
`;
  }

  // Call OpenAI API
  private static async callOpenAI(prompt: string) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a professional movie recommendation expert. You MUST respond with valid JSON in the exact format requested. Do not include any text outside the JSON structure.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      // Try to parse JSON, with fallback handling
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error("JSON parsing failed. Response content:", content);
        console.error("Parse error:", parseError);

        // Try to extract JSON from the response if it contains extra text
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }

        throw new Error("Invalid JSON response from AI");
      }
    } catch (error) {
      console.error("OpenAI API error:", error);
      throw new Error(
        `Failed to get AI recommendations: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Parse and structure the AI response
  private static parseRecommendationResponse(
    aiResponse: {
      explanation?: string;
      recommendations: Array<{
        movieId: number;
        reasoning?: string;
        score?: number;
      }>;
    },
    candidateMovies: MovieRecord[]
  ): MovieRecommendation[] {
    try {
      const { recommendations: aiRecs } = aiResponse;

      if (!Array.isArray(aiRecs)) {
        console.warn(
          "Invalid recommendations format from AI, falling back to top movies"
        );
        // Fallback: return top 3 movies when AI response is invalid
        return candidateMovies.slice(0, 3).map((movie) => ({
          movie,
          reasoning: "Top-rated movie in our database",
          score: 8,
        }));
      }

      // Map AI recommendations to full movie objects
      const recommendations: MovieRecommendation[] = aiRecs
        .map((rec: { movieId: number; reasoning?: string; score?: number }) => {
          const movie = candidateMovies.find((m) => m.id === rec.movieId);
          if (!movie) {
            console.warn(
              `Movie with ID ${rec.movieId} not found in candidates`
            );
            return null;
          }

          return {
            movie,
            reasoning: rec.reasoning || "Recommended by AI",
            score: rec.score || 7,
          };
        })
        .filter(
          (rec: MovieRecommendation | null): rec is MovieRecommendation =>
            rec !== null
        )
        .sort((a, b) => b.score - a.score); // Sort by score descending

      // If no valid recommendations found, return fallback
      if (recommendations.length === 0) {
        console.warn("No valid recommendations from AI, using fallback");
        return candidateMovies.slice(0, 3).map((movie) => ({
          movie,
          reasoning: "Top-rated movie in our database",
          score: 8,
        }));
      }

      return recommendations;
    } catch (error) {
      console.error("Error parsing AI response:", error);
      // Fallback: return top movies when parsing fails
      return candidateMovies.slice(0, 3).map((movie) => ({
        movie,
        reasoning: "Top-rated movie in our database (AI parsing failed)",
        score: 7,
      }));
    }
  }

  // Quick recommendation for a specific genre
  static async getQuickGenreRecommendations(genreIds: number[], count = 3) {
    return this.generateRecommendations({
      userPreferences: { genres: genreIds },
      maxMovies: count,
    });
  }

  // Get recommendations for a specific mood
  static async getMoodBasedRecommendations(mood: string, count = 5) {
    return this.generateRecommendations({
      mood,
      maxMovies: count,
      userPreferences: { minRating: 6.5 },
    });
  }

  // Get recommendations similar to a specific movie
  static async getSimilarMovieRecommendations(movieId: number, count = 5) {
    try {
      // This would require fetching the movie details and finding similar ones
      // For now, we'll use a simple approach
      const movies = await getMoviesFromDatabase({ limit: 50, minRating: 7.0 });
      const targetMovie = movies.find((m) => m.id === movieId);

      if (!targetMovie) {
        throw new Error("Target movie not found");
      }

      return this.generateRecommendations({
        userPreferences: {
          genres: targetMovie.genres,
          minRating: Math.max(6.0, targetMovie.vote_average - 1.5),
        },
        customPrompt: `Find movies similar to "${
          targetMovie.title
        }" (${targetMovie.overview.slice(0, 100)}...)`,
        maxMovies: count,
      });
    } catch (error) {
      console.error("Error getting similar recommendations:", error);
      throw error;
    }
  }
}

// Utility functions for easy access
export async function getPersonalizedRecommendations(
  request: RecommendationRequest
) {
  return MovieRecommendationService.generateRecommendations(request);
}

export async function getQuickRecommendations(genreIds: number[]) {
  return MovieRecommendationService.getQuickGenreRecommendations(genreIds);
}

export async function getMoodRecommendations(mood: string) {
  return MovieRecommendationService.getMoodBasedRecommendations(mood);
}
