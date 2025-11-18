/**
 * Application constants and configuration values
 * Centralized location for all magic numbers, strings, and configuration
 */

// API Configuration
export const API_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// Movie and TMDB Configuration
export const MOVIE_CONFIG = {
  DEFAULT_MOVIE_LIMIT: 20,
  MAX_MOVIES_PER_REQUEST: 100,
  MIN_VOTE_AVERAGE: 0,
  MAX_VOTE_AVERAGE: 10,
  MIN_VOTE_COUNT: 0,
  DEFAULT_LANGUAGE: "en-US",
  DEFAULT_REGION: "US",

  // Curation settings
  UPCOMING_MOVIES_FEATURED_COUNT: 10,
  UPCOMING_MOVIES_FETCH_PAGES: 5,
  MIN_CURATION_SCORE: 5.0,
  CURATION_CACHE_HOURS: 6,

  // Recommendation settings
  DEFAULT_RECOMMENDATIONS_COUNT: 5,
  MAX_RECOMMENDATIONS_COUNT: 20,
  RECOMMENDATION_CANDIDATE_MOVIES: 200,

  // Image configuration
  TMDB_IMAGE_BASE_URL: "https://image.tmdb.org/t/p/",
  POSTER_SIZES: [
    "w92",
    "w154",
    "w185",
    "w342",
    "w500",
    "w780",
    "original",
  ] as const,
  BACKDROP_SIZES: ["w300", "w780", "w1280", "original"] as const,
} as const;

// Database Configuration
export const DATABASE_CONFIG = {
  BATCH_SIZE: 100,
  MAX_CONNECTIONS: 10,
  CONNECTION_TIMEOUT: 30000, // 30 seconds
  QUERY_TIMEOUT: 15000, // 15 seconds

  // Sync settings
  SYNC_INTERVAL_HOURS: 2,
  FORCE_SYNC_COOLDOWN_MINUTES: 5,
  MAX_SYNC_PAGES: 10,
} as const;

// Authentication and Authorization
export const AUTH_CONFIG = {
  SESSION_DURATION: "7 days",
  TOKEN_EXPIRY: 3600, // 1 hour in seconds
  REFRESH_TOKEN_EXPIRY: 604800, // 1 week in seconds

  // Rate limiting
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 100,

  // Auth providers
  PROVIDERS: ["auth0"] as const,
} as const;

// TMDB API Configuration
export const TMDB_CONFIG = {
  BASE_URL: "https://api.themoviedb.org/3",
  API_VERSION: "3",
  REQUEST_TIMEOUT_MS: 10000, // 10 seconds
  RATE_LIMIT_DELAY_MS: 100, // Delay between requests
  MAX_PAGES_PER_CATEGORY: 5,

  // Endpoints
  ENDPOINTS: {
    POPULAR: "/movie/popular",
    TOP_RATED: "/movie/top_rated",
    NOW_PLAYING: "/movie/now_playing",
    UPCOMING: "/movie/upcoming",
    MOVIE_DETAILS: "/movie",
    SEARCH: "/search/movie",
    SEARCH_MULTI: "/search/multi",
    DISCOVER_MOVIE: "/discover/movie",
    DISCOVER_TV: "/discover/tv",
    GENRES: "/genre/movie/list",
    TV_GENRES: "/genre/tv/list",
  },

  // Request limits
  MAX_PAGES_PER_REQUEST: 500,
  RESULTS_PER_PAGE: 20,

  // Cache settings
  CACHE_TTL_MINUTES: 30,
} as const;

// Genre IDs from TMDB
export const GENRE_IDS = {
  ACTION: 28,
  ADVENTURE: 12,
  ANIMATION: 16,
  COMEDY: 35,
  CRIME: 80,
  DOCUMENTARY: 99,
  DRAMA: 18,
  FAMILY: 10751,
  FANTASY: 14,
  HISTORY: 36,
  HORROR: 27,
  MUSIC: 10402,
  MYSTERY: 9648,
  ROMANCE: 10749,
  SCIENCE_FICTION: 878,
  TV_MOVIE: 10770,
  THRILLER: 53,
  WAR: 10752,
  WESTERN: 37,
} as const;

// Reverse mapping for genre names
export const GENRE_NAMES: Record<number, string> = {
  [GENRE_IDS.ACTION]: "Action",
  [GENRE_IDS.ADVENTURE]: "Adventure",
  [GENRE_IDS.ANIMATION]: "Animation",
  [GENRE_IDS.COMEDY]: "Comedy",
  [GENRE_IDS.CRIME]: "Crime",
  [GENRE_IDS.DOCUMENTARY]: "Documentary",
  [GENRE_IDS.DRAMA]: "Drama",
  [GENRE_IDS.FAMILY]: "Family",
  [GENRE_IDS.FANTASY]: "Fantasy",
  [GENRE_IDS.HISTORY]: "History",
  [GENRE_IDS.HORROR]: "Horror",
  [GENRE_IDS.MUSIC]: "Music",
  [GENRE_IDS.MYSTERY]: "Mystery",
  [GENRE_IDS.ROMANCE]: "Romance",
  [GENRE_IDS.SCIENCE_FICTION]: "Science Fiction",
  [GENRE_IDS.TV_MOVIE]: "TV Movie",
  [GENRE_IDS.THRILLER]: "Thriller",
  [GENRE_IDS.WAR]: "War",
  [GENRE_IDS.WESTERN]: "Western",
} as const;

// Countries for filtering (ISO 3166-1 alpha-2 codes)
export const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "CN", name: "China" },
  { code: "IN", name: "India" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "AR", name: "Argentina" },
  { code: "RU", name: "Russia" },
  { code: "PL", name: "Poland" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" },
  { code: "IE", name: "Ireland" },
  { code: "NZ", name: "New Zealand" },
  { code: "ZA", name: "South Africa" },
] as const;

// Movie Categories
export const MOVIE_CATEGORIES = {
  POPULAR: "popular",
  TOP_RATED: "top_rated",
  NOW_PLAYING: "now_playing",
  UPCOMING: "upcoming",
} as const;

// Curation Configuration
export const CURATION_CONFIG = {
  // Scoring weights for upcoming movies
  WEIGHTS: {
    VOTE_AVERAGE: 0.4,
    VOTE_COUNT: 0.2,
    POPULARITY: 0.2,
    RELEASE_DATE: 0.1,
    GENRE_DIVERSITY: 0.1,
  },

  // Minimum requirements
  MIN_VOTE_COUNT: 10,
  MIN_VOTE_AVERAGE: 5.0,
  MIN_POPULARITY: 5.0,

  // Release date filters (in days)
  MAX_DAYS_PAST_RELEASE: 180, // 6 months
  MAX_DAYS_FUTURE_RELEASE: 365, // 1 year

  // Diversity settings
  MAX_SAME_GENRE_COUNT: 3,
  PREFERRED_GENRE_VARIETY: 5,

  // Update frequency
  UPDATE_INTERVAL_HOURS: 6,
  FORCE_UPDATE_COOLDOWN_HOURS: 1,
} as const;

// UI Configuration
export const UI_CONFIG = {
  // Pagination
  DEFAULT_ITEMS_PER_PAGE: 20,
  PAGINATION_SIZES: [10, 20, 50, 100] as const,

  // Loading states
  SKELETON_COUNT: 10,
  LOADING_DELAY_MS: 200,

  // Animation
  ANIMATION_DURATION: 300,
  CAROUSEL_AUTOPLAY_DELAY: 5000,

  // Responsive breakpoints (matching Tailwind CSS)
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    "2XL": 1536,
  },

  // Movie card dimensions
  POSTER_ASPECT_RATIO: 1.5, // 2:3 ratio
  CARD_MIN_HEIGHT: 400,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  // Generic
  INTERNAL_ERROR: "An unexpected error occurred. Please try again later.",
  VALIDATION_ERROR: "Please check your input and try again.",
  NETWORK_ERROR: "Network error. Please check your connection.",

  // Authentication
  AUTH_REQUIRED: "Authentication required to access this resource.",
  AUTH_INVALID: "Invalid authentication credentials.",
  AUTH_EXPIRED: "Your session has expired. Please log in again.",

  // Movies
  MOVIE_NOT_FOUND: "Movie not found.",
  MOVIES_FETCH_FAILED: "Failed to fetch movies. Please try again.",
  MOVIE_DETAILS_FAILED: "Failed to load movie details.",

  // Database
  DATABASE_CONNECTION_FAILED: "Database connection failed.",
  DATABASE_QUERY_FAILED: "Database query failed.",

  // External APIs
  TMDB_API_ERROR: "Movie database service is temporarily unavailable.",

  // Sync
  SYNC_IN_PROGRESS: "Database sync is already in progress.",
  SYNC_FAILED: "Database synchronization failed.",

  // Curation
  CURATION_FAILED: "Movie curation process failed.",
  CURATION_IN_PROGRESS: "Movie curation is already in progress.",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  // Movies
  MOVIES_FETCHED: "Movies loaded successfully.",
  MOVIE_ADDED_TO_WISHLIST: "Movie added to your wishlist.",
  MOVIE_REMOVED_FROM_WISHLIST: "Movie removed from your wishlist.",

  // Recommendations
  RECOMMENDATIONS_GENERATED: "Recommendations generated successfully.",

  // Sync
  SYNC_COMPLETED: "Database synchronized successfully.",

  // Curation
  CURATION_COMPLETED: "Movie curation completed successfully.",

  // Authentication
  LOGIN_SUCCESS: "Logged in successfully.",
  LOGOUT_SUCCESS: "Logged out successfully.",
} as const;

// Cache Keys
export const CACHE_KEYS = {
  MOVIES_PREFIX: "movies:",
  MOVIE_DETAILS_PREFIX: "movie:",
  RECOMMENDATIONS_PREFIX: "recommendations:",
  SYNC_STATUS: "sync:status",
  CURATION_STATUS: "curation:status",
  USER_PROFILE_PREFIX: "profile:",
  WISHLIST_PREFIX: "wishlist:",
} as const;

// Time Constants (in milliseconds)
export const TIME_CONSTANTS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,
} as const;

// Environment-specific settings
export const ENV_CONFIG = {
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",

  // API URLs
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",

  // Feature flags
  enableDebugLogs: process.env.NODE_ENV === "development",
  enablePerformanceMetrics: process.env.ENABLE_METRICS === "true",
  enableRateLimiting: process.env.NODE_ENV === "production",
} as const;

// Regular Expressions
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  TMDB_IMAGE_PATH: /^\/[a-zA-Z0-9]+\.(jpg|jpeg|png)$/,
  YEAR: /^\d{4}$/,
} as const;

// Recommendations Configuration
export const RECOMMENDATIONS_CONFIG = {
  MAX_RECOMMENDATIONS: 10,
  MIN_RECOMMENDATIONS: 1,
  DEFAULT_RECOMMENDATIONS: 5,
  MIN_RATING_THRESHOLD: 6.0,
  POPULARITY_THRESHOLD: 10.0,
  MAX_RETRIES: 3,
} as const;

// Movie Filter Presets
export const MOVIE_FILTER_PRESETS = {
  topRated: {
    minRating: 7.5,
    minVoteCount: 1000,
    sortBy: "rating" as const,
    sortOrder: "desc" as const,
  },

  popular: {
    sortBy: "popularity" as const,
    sortOrder: "desc" as const,
  },

  recent: {
    yearRange: {
      start: new Date().getFullYear() - 1,
    },
    sortBy: "release_date" as const,
    sortOrder: "desc" as const,
  },

  familyFriendly: {
    genres: [16, 10751, 35], // Animation, Family, Comedy
    maxRating: 8.0,
    excludeGenres: [27, 53], // Horror, Thriller
  },

  actionPacked: {
    genres: [28, 12, 878], // Action, Adventure, Sci-Fi
    minRating: 6.0,
  },

  dramatic: {
    genres: [18, 36, 10752], // Drama, History, War
    minRating: 7.0,
  },

  lightHearted: {
    genres: [35, 10749], // Comedy, Romance
    minRating: 6.5,
  },
} as const;

export type FilterPresetName = keyof typeof MOVIE_FILTER_PRESETS;
