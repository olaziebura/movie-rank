# Movie Database Integration & AI Recommendations

This implementation provides a comprehensive movie database system with TMDB integration, Supabase storage, and OpenAI-powered recommendations for your MovieRank application.

## 🎬 Features

### Movie Database Integration

- **TMDB API Integration**: Fetches movies from popular, top_rated, now_playing, and upcoming endpoints
- **Supabase Storage**: Stores movie data locally for fast access and offline capabilities
- **Automated Sync**: CRON job updates database every 2 hours
- **Smart Filtering**: Advanced filtering by genre, rating, year, and more

### AI-Powered Recommendations

- **OpenAI GPT-4o Integration**: Intelligent movie recommendations based on user preferences
- **Mood-Based Suggestions**: Get recommendations based on current mood or occasion
- **Personalized Results**: Considers user preferences, genres, and rating thresholds
- **Similar Movie Discovery**: Find movies similar to ones you already like

## 📁 File Structure

```
src/
├── lib/
│   ├── tmdb/
│   │   └── movies.ts           # TMDB API integration
│   ├── supabase/
│   │   └── movies.ts           # Database operations
│   ├── services/
│   │   ├── movieSync.ts        # Database sync service
│   │   └── movieRecommendations.ts # AI recommendation engine
│   └── utils/
│       └── movieFilters.ts     # Genre mappings & filtering utilities
├── app/api/
│   ├── movies/
│   │   ├── route.ts            # Movie database API
│   │   ├── sync/route.ts       # Manual sync endpoint
│   │   └── recommendations/route.ts # AI recommendations API
│   └── cron/
│       └── sync-movies/route.ts # CRON sync endpoint
└── types/
    └── movie.ts                # TypeScript definitions
```

## 🚀 Setup

### 1. Environment Variables

Add these to your `.env.local`:

```env
# TMDB API (required)
TMDB_BASE_URL=https://api.themoviedb.org/3
TMDB_BEARER_TOKEN=your_tmdb_bearer_token

# OpenAI API (required)
OPENAI_API_KEY=your_openai_api_key

# Supabase (should already be configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# CRON Security (optional but recommended)
CRON_SECRET=your_secure_random_string
```

### 2. Database Schema

Create this table in your Supabase database:

```sql
CREATE TABLE movies (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  overview TEXT,
  genres INTEGER[] DEFAULT '{}',
  release_date DATE,
  poster_path TEXT,
  vote_average REAL DEFAULT 0,
  vote_count INTEGER DEFAULT 0,
  popularity REAL DEFAULT 0,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_movies_genres ON movies USING GIN (genres);
CREATE INDEX idx_movies_vote_average ON movies (vote_average);
CREATE INDEX idx_movies_popularity ON movies (popularity);
CREATE INDEX idx_movies_release_date ON movies (release_date);
CREATE INDEX idx_movies_category ON movies (category);
```

### 3. Initial Database Sync

Run the initial sync to populate your database:

```bash
curl -X POST http://localhost:3000/api/movies/sync \
  -H "Content-Type: application/json" \
  -d '{"force": true, "maxPages": 5}'
```

## 📡 API Endpoints

### Movie Database

#### Get Movies

```
GET /api/movies?limit=20&category=popular&minRating=7&genres=28,12
```

**Query Parameters:**

- `limit` (number): Number of movies to return (default: 20)
- `offset` (number): Pagination offset (default: 0)
- `category` (string): Movie category (popular, top_rated, now_playing, upcoming)
- `minRating` (number): Minimum vote average
- `maxRating` (number): Maximum vote average
- `genres` (string): Comma-separated genre IDs
- `search` (string): Search in title and overview
- `sortBy` (string): Sort by vote_average, popularity, or release_date
- `sortOrder` (string): asc or desc

### Database Sync

#### Manual Sync

```
POST /api/movies/sync
Content-Type: application/json

{
  "force": true,
  "maxPages": 3
}
```

#### Check Sync Status

```
GET /api/movies/sync
```

### AI Recommendations

#### Personalized Recommendations

```
POST /api/movies/recommendations
Content-Type: application/json

{
  "userPreferences": {
    "genres": [28, 12],
    "minRating": 7.0,
    "categories": ["popular", "top_rated"]
  },
  "mood": "exciting",
  "occasion": "date night",
  "maxMovies": 5
}
```

#### Quick Recommendations

```
GET /api/movies/recommendations?genres=28,12&count=5
GET /api/movies/recommendations?mood=relaxing&count=3
```

## 🤖 Using the AI Recommendation System

### Basic Usage

```typescript
import { MovieRecommendationService } from "@/lib/services/movieRecommendations";

// Get personalized recommendations
const recommendations =
  await MovieRecommendationService.generateRecommendations({
    userPreferences: {
      genres: [28, 12, 878], // Action, Adventure, Sci-Fi
      minRating: 7.0,
      yearRange: { start: 2020 },
    },
    mood: "epic adventure",
    maxMovies: 5,
  });

// Get mood-based recommendations
const moodRecs = await MovieRecommendationService.getMoodBasedRecommendations(
  "romantic",
  3
);

// Get similar movies
const similar = await MovieRecommendationService.getSimilarMovieRecommendations(
  550,
  5
); // Fight Club
```

### Response Format

```typescript
{
  "success": true,
  "recommendations": [
    {
      "movie": {
        "id": 299536,
        "title": "Avengers: Infinity War",
        "overview": "As the Avengers and their allies...",
        "vote_average": 8.3,
        "genres": [12, 878, 28],
        // ... other movie data
      },
      "reasoning": "Perfect blend of action and sci-fi with excellent ratings",
      "score": 9.2
    }
  ],
  "explanation": "Based on your preference for action and sci-fi...",
  "totalMoviesConsidered": 150,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## ⚡ Performance & Optimization

### Database Sync Strategy

- Fetches movies in batches to respect API rate limits
- Uses upsert operations to handle duplicates efficiently
- Implements intelligent deduplication across categories
- Runs every 2 hours via CRON job

### Recommendation Performance

- Pre-filters movies in database before sending to AI
- Limits candidate movies to 100 for optimal AI performance
- Caches genre mappings for faster filtering
- Uses structured JSON responses for consistent parsing

## 🎯 Genre System

The system uses TMDB's standard genre IDs:

```typescript
const GENRES = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  53: "Thriller",
  10752: "War",
  37: "Western",
};
```

## 🔧 Utility Functions

### Movie Filtering

```typescript
import { MovieFilterUtils } from "@/lib/utils/movieFilters";

// Filter by rating
const highRated = MovieFilterUtils.filterByRating(movies, 8.0, 10.0);

// Get recent movies
const recent = MovieFilterUtils.getRecentMovies(movies, 20);

// Diverse selection across genres
const diverse = MovieFilterUtils.getDiverseSelection(movies, 15);
```

### Database Operations

```typescript
import { getMoviesFromDatabase, upsertMovies } from "@/lib/supabase/movies";

// Get filtered movies
const actionMovies = await getMoviesFromDatabase({
  genres: [28],
  minRating: 7.0,
  limit: 20,
});

// Batch insert movies
await upsertMovies(newMovies);
```

## 🕐 CRON Job Setup

### Vercel Cron (Recommended)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-movies",
      "schedule": "0 */2 * * *"
    }
  ]
}
```

### External CRON Service

Configure your CRON service to call:

```bash
curl -X POST https://your-domain.com/api/cron/sync-movies \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 🎪 Example Integration

### Frontend Component

```typescript
"use client";

import { useState } from "react";

export function MovieRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  const getRecommendations = async (mood: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/movies/recommendations?mood=${mood}&count=5`
      );
      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (error) {
      console.error("Failed to get recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => getRecommendations("exciting")}>
        Get Exciting Movies
      </button>

      {loading && <div>Loading recommendations...</div>}

      {recommendations.map((rec) => (
        <div key={rec.movie.id}>
          <h3>{rec.movie.title}</h3>
          <p>{rec.reasoning}</p>
          <p>Score: {rec.score}/10</p>
        </div>
      ))}
    </div>
  );
}
```

## 🚨 Error Handling

The system includes comprehensive error handling:

- **API Rate Limiting**: Built-in delays and retry logic
- **Database Errors**: Graceful fallbacks and logging
- **OpenAI API Issues**: Structured error responses
- **Type Safety**: Full TypeScript coverage

## 📊 Monitoring

Monitor your system with:

```bash
# Check database health
curl http://localhost:3000/api/movies/sync

# Verify CRON endpoint
curl http://localhost:3000/api/cron/sync-movies

# Test recommendations
curl -X POST http://localhost:3000/api/movies/recommendations \
  -H "Content-Type: application/json" \
  -d '{"mood": "test"}'
```

## 🔮 Future Enhancements

- **User Rating Integration**: Incorporate user ratings into recommendations
- **Collaborative Filtering**: Use user behavior patterns
- **Real-time Updates**: WebSocket connections for live updates
- **Advanced Caching**: Redis integration for better performance
- **Analytics**: Track recommendation success rates

---

This system provides a robust foundation for movie discovery and recommendations. The modular architecture makes it easy to extend and customize based on your specific needs.
