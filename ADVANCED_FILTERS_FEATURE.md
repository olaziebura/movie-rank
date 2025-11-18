# Advanced Search Filters Feature

## Overview

Implemented a comprehensive, complex filtering system for movie and TV show search with multiple filter types and TMDB API integration.

## Features Implemented

### 1. Filter Types

#### Media Type Filter
- **Movies**: Search only movies
- **TV Shows**: Search only TV series
- **All**: Search both movies and TV shows

#### Genre Filter
- Multi-select genre filtering
- 19 genres available:
  - Action, Adventure, Animation, Comedy, Crime
  - Documentary, Drama, Family, Fantasy, History
  - Horror, Music, Mystery, Romance, Science Fiction
  - TV Movie, Thriller, War, Western

#### Release Date Range
- **From Year**: Select starting year (last 100 years)
- **To Year**: Select ending year (last 100 years)
- Filter by specific date ranges or eras

#### Country Filter
- 28 countries available including:
  - US, UK, Canada, Australia
  - France, Germany, Italy, Spain
  - Japan, South Korea, China, India
  - Poland, Sweden, Norway, Denmark
  - And more...

#### Rating Filter
- **Minimum Rating**: 0-10 scale (0.5 increments)
- **Maximum Rating**: 0-10 scale (0.5 increments)
- Filter by TMDB vote average

#### Sort Options
- Popularity (High to Low / Low to High)
- Rating (High to Low / Low to High)
- Release Date (Newest / Oldest)

### 2. User Interface

#### FilterPanel Component
- Expandable/collapsible panel
- Active filter count badge
- Clear all filters button
- Organized sections for each filter type
- Responsive grid layout for genre selection
- Dropdown selectors for years and country
- Number inputs for rating range

#### SearchBar Integration
- Optional filter panel via `showFilters` prop
- Filter panel appears above search input
- Filters applied automatically on change
- URL parameters updated for sharing/bookmarking

### 3. API Integration

#### TMDB Discover Endpoint
- Uses `/discover/movie` and `/discover/tv` endpoints
- Falls back to `/search/movie` or `/search/multi` for text queries
- Supports complex filter combinations:
  - `with_genres`: Genre filtering
  - `release_date.gte/lte`: Date range (movies)
  - `first_air_date.gte/lte`: Date range (TV shows)
  - `vote_average.gte/lte`: Rating range
  - `with_origin_country`: Country filter
  - `sort_by`: Sort order
  - `vote_count.gte`: Minimum vote count (10) for relevance

#### API Route Updates
- `/api/search/movies` accepts all filter parameters
- Query string parameters:
  - `q`: Search query (optional)
  - `mediaType`: movie/tv/all
  - `genres`: Comma-separated genre IDs
  - `yearFrom/yearTo`: Release year range
  - `country`: ISO country code
  - `minRating/maxRating`: Rating range
  - `sortBy`: Sort order
  - `page`: Page number

### 4. Search Page Integration

- Filters populate from URL query parameters
- Maintains filter state across page navigation
- Pagination preserves all active filters
- Shows filter-only results (no query required)
- "View all results" maintains filter context

## Technical Implementation

### New Files Created

1. **src/components/FilterPanel.tsx**
   - Main filter UI component
   - Manages filter state locally
   - Callbacks for filter changes and clearing

2. **Updated TypeScript Types** (src/types/movie.ts)
   ```typescript
   export type MediaType = "movie" | "tv" | "all";
   
   export type SearchFilters = {
     query?: string;
     mediaType?: MediaType;
     genres?: number[];
     releaseYearFrom?: number;
     releaseYearTo?: number;
     country?: string;
     minRating?: number;
     maxRating?: number;
     sortBy?: string;
   };
   
   export type Genre = {
     id: number;
     name: string;
   };
   ```

### Updated Files

1. **src/lib/utils/constants.ts**
   - Added `COUNTRIES` array with 28 countries
   - Added TMDB endpoints: `DISCOVER_MOVIE`, `DISCOVER_TV`, `SEARCH_MULTI`

2. **src/lib/tmdb/movies.ts**
   - New `discoverWithFilters()` function
   - Handles complex filter combinations
   - Switches between search and discover endpoints
   - Separate logic for movies vs TV shows

3. **src/app/api/search/movies/route.ts**
   - Parses filter parameters from query string
   - Validates at least query or filters present
   - Returns filter metadata in response

4. **src/components/SearchBar.tsx**
   - Added `showFilters` prop
   - Filter state management
   - URL building with all filter parameters
   - Filter-aware search execution

5. **src/app/search/page.tsx**
   - Parses all filter parameters from URL
   - Uses `discoverWithFilters()` instead of `searchMovies()`
   - Pagination with filter preservation
   - Shows filter panel by default

## Usage Examples

### Basic Text Search
```
/search?q=inception
```

### Genre Filter Only
```
/search?genres=28,878&sortBy=vote_average.desc
(Action + Sci-Fi, sorted by rating)
```

### Complete Filter Combination
```
/search?q=batman&mediaType=movie&genres=28,80&yearFrom=2000&yearTo=2023&country=US&minRating=7&sortBy=popularity.desc
(Batman movies, Action+Crime, 2000-2023, US, 7+ rating, by popularity)
```

### Date Range Filter
```
/search?yearFrom=1990&yearTo=1999&genres=18&sortBy=vote_average.desc
(1990s dramas, sorted by rating)
```

### Country-Specific Content
```
/search?country=KR&genres=18&minRating=8
(South Korean dramas rated 8+)
```

## Benefits

1. **Advanced Discovery**: Users can find movies/shows without knowing exact titles
2. **Precise Filtering**: Multiple filter types can be combined
3. **Shareable URLs**: All filters encoded in URL for bookmarking/sharing
4. **No Query Required**: Can browse by filters alone
5. **Responsive Design**: Works on mobile and desktop
6. **Performance**: Uses TMDB's optimized discover endpoint
7. **Type Safety**: Full TypeScript coverage
8. **Extensible**: Easy to add more filter types

## Future Enhancements

Potential additions:
- Runtime filter (movie length)
- Language filter
- Certification filter (G, PG, PG-13, R, etc.)
- Keyword filtering
- Cast/crew filtering
- Streaming provider filter
- Budget/revenue filters
- Filter presets/saved searches
- Advanced boolean logic (AND/OR/NOT)

## Notes

- Minimum vote count of 10 applied to ensure result relevance
- TV shows use `first_air_date` instead of `release_date`
- Genre IDs are consistent across movies and TV shows
- Country codes follow ISO 3166-1 alpha-2 standard
- All filters are optional and can be combined freely
