/**
 * Application constants and configuration values
 * Centralized location for all magic numbers, strings, and configuration
 */

// TMDB API Configuration
export const TMDB_CONFIG = {
  BASE_URL: "https://api.themoviedb.org/3",
  API_VERSION: "3",
  REQUEST_TIMEOUT_MS: 10000, // 10 seconds
  RATE_LIMIT_DELAY_MS: 100, // Delay between requests

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
  { code: "US", name: "🇺🇸 United States" },
  { code: "GB", name: "🇬🇧 United Kingdom" },
  { code: "CA", name: "🇨🇦 Canada" },
  { code: "AU", name: "🇦🇺 Australia" },
  { code: "FR", name: "🇫🇷 France" },
  { code: "DE", name: "🇩🇪 Germany" },
  { code: "IT", name: "🇮🇹 Italy" },
  { code: "ES", name: "🇪🇸 Spain" },
  { code: "JP", name: "🇯🇵 Japan" },
  { code: "KR", name: "🇰🇷 South Korea" },
  { code: "CN", name: "🇨🇳 China" },
  { code: "IN", name: "🇮🇳 India" },
  { code: "BR", name: "🇧🇷 Brazil" },
  { code: "MX", name: "🇲🇽 Mexico" },
  { code: "AR", name: "🇦🇷 Argentina" },
  { code: "RU", name: "🇷🇺 Russia" },
  { code: "PL", name: "🇵🇱 Poland" },
  { code: "SE", name: "🇸🇪 Sweden" },
  { code: "NO", name: "🇳🇴 Norway" },
  { code: "DK", name: "🇩🇰 Denmark" },
  { code: "FI", name: "🇫🇮 Finland" },
  { code: "NL", name: "🇳🇱 Netherlands" },
  { code: "BE", name: "🇧🇪 Belgium" },
  { code: "CH", name: "🇨🇭 Switzerland" },
  { code: "AT", name: "🇦🇹 Austria" },
  { code: "IE", name: "🇮🇪 Ireland" },
  { code: "NZ", name: "🇳🇿 New Zealand" },
  { code: "ZA", name: "🇿🇦 South Africa" },
  { code: "HK", name: "🇭🇰 Hong Kong" },
  { code: "SG", name: "🇸🇬 Singapore" },
  { code: "TH", name: "🇹🇭 Thailand" },
  { code: "ID", name: "🇮🇩 Indonesia" },
  { code: "MY", name: "🇲🇾 Malaysia" },
  { code: "PH", name: "🇵🇭 Philippines" },
  { code: "VN", name: "🇻🇳 Vietnam" },
  { code: "TR", name: "🇹🇷 Turkey" },
  { code: "GR", name: "🇬🇷 Greece" },
  { code: "PT", name: "🇵🇹 Portugal" },
  { code: "CZ", name: "🇨🇿 Czech Republic" },
  { code: "HU", name: "🇭🇺 Hungary" },
  { code: "RO", name: "🇷🇴 Romania" },
  { code: "IL", name: "🇮🇱 Israel" },
  { code: "AE", name: "🇦🇪 United Arab Emirates" },
  { code: "SA", name: "🇸🇦 Saudi Arabia" },
  { code: "EG", name: "🇪🇬 Egypt" },
  { code: "NG", name: "🇳🇬 Nigeria" },
  { code: "CL", name: "🇨🇱 Chile" },
  { code: "CO", name: "🇨🇴 Colombia" },
  { code: "PE", name: "🇵🇪 Peru" },
  { code: "VE", name: "🇻🇪 Venezuela" },
] as const;
