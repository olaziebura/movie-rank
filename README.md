# MovieRank

A modern movie discovery and wishlist application built with Next.js, featuring TMDB integration, user reviews, and real-time data sync.

## Features

- 🎬 **Movie Discovery**: Browse popular, top-rated, and upcoming movies from TMDB
- ⭐ **Personal Wishlist**: Save and manage your favorite movies
- 📝 **User Reviews**: Rate and review movies with your own comments
- 🔍 **Smart Search**: Find movies with real-time search and suggestions
- 📱 **Responsive Design**: Beautiful UI that works on all devices
- 🔐 **Authentication**: Secure user authentication with Auth0
- ⚡ **Real-time Sync**: Automatic database synchronization with TMDB

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Auth0
- **APIs**: TMDB API
- **Deployment**: Vercel

## Prerequisites

Before you begin, ensure you have:

- Node.js 20+ installed
- A [Supabase](https://supabase.com) account and project
- A [TMDB API](https://www.themoviedb.org/settings/api) key
- An [Auth0](https://auth0.com) account and application

### 1. Clone the Repository

```bash
git clone https://github.com/olaziebura/movie-rank.git
cd movie_rank
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# TMDB API
TMDB_API_KEY=your_tmdb_api_key
TMDB_API_READ_ACCESS_TOKEN=your_tmdb_read_access_token

# Auth0
AUTH0_SECRET=your_auth0_secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=your_auth0_domain
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret

# Vercel CRON Secret (for production)
CRON_SECRET=your_random_secret_string
```

### 4. Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the `supabase-setup.sql` file from this repository
4. Copy and paste the entire SQL script into the editor
5. Run the script to create all tables, policies, and functions

This will create:

- `profiles` table (user data and wishlists)
- `movies` table (cached TMDB movie data)
- `reviews` table (user movie reviews and ratings)
- `upcoming_movies_featured` table (curated upcoming movies)
- All necessary indexes, triggers, and RLS policies

### 5. Configure Auth0

1. Create a new Auth0 application (Regular Web Application)
2. Set the following in your Auth0 application settings:
   - **Allowed Callback URLs**: `http://localhost:3000/api/auth/callback`
   - **Allowed Logout URLs**: `http://localhost:3000`
   - **Allowed Web Origins**: `http://localhost:3000`
3. Enable **Username-Password-Authentication** in Connections
4. Copy your Domain, Client ID, and Client Secret to `.env.local`

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes
│   │   ├── auth/                 # Auth0 authentication
│   │   ├── cron/                 # Scheduled jobs (movie sync, curation)
│   │   ├── movies/               # Movie data endpoints
│   │   ├── user/                 # User profile management
│   │   └── wishlist/             # Wishlist operations
│   ├── movie/[id]/              # Individual movie page
│   ├── search/                   # Movie search page
│   ├── wishlist/                 # User wishlist page
│   ├── profile/                  # User profile page
│   └── settings/                 # User settings page
├── components/                   # React components
│   ├── homepage/                 # Homepage-specific components
│   └── ui/                       # shadcn/ui components
├── lib/                          # Core business logic
│   ├── auth/                     # Auth0 configuration
│   ├── services/                 # Business logic services
│   │   ├── movieSync.ts          # TMDB sync service
│   │   └── upcomingMoviesCuration.ts # Upcoming movies curation
│   ├── supabase/                 # Supabase database operations
│   ├── tmdb/                     # TMDB API integration
│   └── utils/                    # Utility functions
├── types/                        # TypeScript type definitions
└── hooks/                        # Custom React hooks
```

## Key Features Explained

### Movie Database Sync

The app automatically syncs popular movies from TMDB:

- Runs via CRON job every 2 hours (configurable in `vercel.json`)
- Caches movies in Supabase for fast access
- Can be manually triggered via `/api/movies/sync`

### Upcoming Movies Curation

A system that selects the top 10 most anticipated upcoming movies:

- Analyzes release dates, popularity, and ratings
- Ensures genre diversity
- Updates daily via CRON job
- Access via `/api/upcoming-movies/featured`

### User Reviews

Users can rate and review movies:

- 10-star rating system (0-10)
- Optional text comments
- Combined rating calculation with TMDB ratings
- Users can edit or delete their own reviews

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add all environment variables from `.env.local`
4. Update Auth0 URLs to use your production domain
5. Deploy!

### Configure CRON Jobs

The app uses Vercel CRON for:

- **Movie Sync**: Runs every 2 hours (updates popular movies cache)
- **Upcoming Curation**: Runs daily at 00:00 UTC (curates top upcoming movies)

CRON configuration is in `vercel.json`. Make sure to set `CRON_SECRET` in your environment variables.

## API Routes

### Public Endpoints

- `GET /api/movies` - Fetch movies with filters
- `GET /api/upcoming-movies/featured` - Get curated upcoming movies
- `GET /api/search/movies?q=query` - Search movies

### Protected Endpoints (Require Authentication)

- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/wishlist` - Get user wishlist
- `POST /api/wishlist` - Add to wishlist
- `DELETE /api/wishlist` - Remove from wishlist

### Admin Endpoints

- `GET /api/admin/check` - Check admin status
- `POST /api/admin/set-admin` - Grant admin privileges (dev only)

### CRON Endpoints (Protected)

- `GET /api/cron/sync-movies` - Trigger movie database sync
- `GET /api/cron/curate-upcoming-movies` - Trigger upcoming movies curation

## Environment-Specific Features

### Development Only

- `/admin-dev` - Admin utility page (accessible only in development mode)

## Database Schema

### Profiles Table

Stores user information and wishlists.

```sql
id TEXT PRIMARY KEY           -- Auth0 user ID
name TEXT                     -- User's name
email TEXT UNIQUE             -- User's email
profile_image_url TEXT        -- Profile image URL
wishlist INTEGER[]            -- Array of movie IDs
admin BOOLEAN                 -- Admin flag
```

### Movies Table

Caches movie data from TMDB.

```sql
id INTEGER PRIMARY KEY        -- TMDB movie ID
title TEXT                    -- Movie title
overview TEXT                 -- Movie description
release_date DATE             -- Release date
poster_path TEXT              -- Poster image path
vote_average REAL             -- Average rating (0-10)
popularity REAL               -- TMDB popularity score
genre_ids INTEGER[]           -- Array of genre IDs
```

### Upcoming Movies Featured Table

Curated list of top upcoming movies.

```sql
id INTEGER PRIMARY KEY        -- TMDB movie ID
worth_waiting_score REAL      -- AI-calculated anticipation score
-- ... (same fields as movies table)
```

## Troubleshooting

### Database Connection Issues

- Verify your Supabase URL and keys in `.env.local`
- Ensure RLS policies are properly set up (check `supabase-setup.sql`)
- Check that your Supabase project is active (free tier pauses after 7 days of inactivity)

### Auth0 Issues

- Verify callback URLs match your deployment URL
- Ensure `AUTH0_SECRET` is a long random string (use `openssl rand -hex 32`)
- Check that your Auth0 application type is "Regular Web Application"

### TMDB API Errors

- Verify your API key is valid
- Check you haven't exceeded rate limits (40 requests/10 seconds)
- Ensure `TMDB_API_READ_ACCESS_TOKEN` is set if using v4 endpoints

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have questions, please file an issue on GitHub.

---

Built with ❤️ using Next.js and modern web technologies
