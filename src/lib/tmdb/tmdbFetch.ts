const BASE_URL = process.env.TMDB_BASE_URL!;
const BEARER_TOKEN = process.env.TMDB_BEARER_TOKEN!;

// Helper function to build URL with API key and parameters
// This function fetches data from the TMDB API using the provided endpoint and parameters.
// It constructs the URL with the base URL, API key, and any additional parameters.
// It then makes a GET request to the TMDB API and returns the JSON response.
// If the response is not OK, it throws an error with the status and status text.
// The function is asynchronous and returns a promise that resolves to the JSON response.
// It uses the fetch API to make the request and handles errors appropriately.
// It is designed to be used in a TypeScript environment and can be imported into other modules.

export async function tmdbFetch(
  endpoint: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: Record<string, any> = {}
) {
  // Construct the URL
  const url = new URL(`${BASE_URL}${endpoint}`);

  // Add optional parameters like language, page, etc.
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
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
  });

  if (!response.ok) {
    throw new Error(
      `TMDB API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}
