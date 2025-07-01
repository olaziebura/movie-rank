import { MovieRankError, ErrorType } from "@/lib/utils/errorHandler";
import { TMDB_CONFIG } from "@/lib/utils/constants";

const BASE_URL = process.env.TMDB_BASE_URL!;
const BEARER_TOKEN = process.env.TMDB_BEARER_TOKEN!;

if (!BASE_URL || !BEARER_TOKEN) {
  throw new Error("Missing TMDB environment variables");
}

/**
 * Fetches data from the TMDB API using the provided endpoint and parameters.
 * Constructs the URL with the base URL and parameters, makes a GET request with Bearer token authentication.
 *
 * @param endpoint - The TMDB API endpoint to fetch from
 * @param params - Optional query parameters to include in the request
 * @returns Promise resolving to the JSON response from TMDB API
 * @throws {MovieRankError} When the API request fails
 */
export async function tmdbFetch(
  endpoint: string,
  params: Record<string, unknown> = {}
): Promise<unknown> {
  const startTime = Date.now();

  try {
    // Construct the URL
    const url = new URL(`${BASE_URL}${endpoint}`);

    // Add optional parameters like language, page, etc.
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });

    // Fetch with Bearer token in the header
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${BEARER_TOKEN}`,
      },
      signal: AbortSignal.timeout(TMDB_CONFIG.REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new MovieRankError(
        ErrorType.EXTERNAL_API_ERROR,
        `TMDB API error: ${response.status} ${response.statusText}`,
        response.status,
        "TMDB_API_ERROR",
        { endpoint, paramCount: Object.keys(params).length }
      );
    }
    return await response.json();
  } catch (error) {
    if (error instanceof MovieRankError) {
      throw error;
    }

    throw new MovieRankError(
      ErrorType.EXTERNAL_API_ERROR,
      `Failed to fetch from TMDB: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500,
      "TMDB_FETCH_ERROR",
      { endpoint, paramCount: Object.keys(params).length },
      error instanceof Error ? error : undefined
    );
  }
}
