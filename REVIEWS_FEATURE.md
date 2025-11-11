# User Reviews Feature

## Overview

The MovieRank app now includes a comprehensive user review system that allows users to rate and review movies. User ratings are combined with TMDB ratings to provide a more comprehensive movie score.

## Features

### ⭐ User Ratings

- Users can rate movies from 0-10 (using a star-based interface)
- Each user can only submit one review per movie
- Users can update or delete their existing reviews

### 💬 Review Comments

- Optional text reviews alongside ratings
- Reviews display the author's name and date
- Edit history tracking (shows when a review was updated)

### 📊 Combined Statistics

The system shows three types of ratings:

1. **TMDB Rating** - Original rating from The Movie Database
2. **User Reviews** - Average rating from your app's users
3. **Combined Rating** - Weighted average of TMDB and user ratings

### Formula for Combined Rating

```
Combined Rating = (TMDB_rating × TMDB_count + User_rating × User_count) / (TMDB_count + User_count)
```

This means if a movie has:

- TMDB: 8.5 rating with 10,000 votes
- User Reviews: 9.0 rating with 50 reviews
- Combined: 8.52 (weighted towards TMDB due to higher vote count)

## Database Setup

### For New Projects

The `supabase-setup.sql` file already includes the reviews table. Just run it in your Supabase SQL Editor.

### For Existing Projects

Run the `add-reviews-migration.sql` file in your Supabase SQL Editor to add the reviews feature to your existing database.

## Database Schema

### Reviews Table

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY,
  user_id TEXT REFERENCES profiles(id),
  movie_id INTEGER,
  rating REAL (0-10),
  comment TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_id, movie_id)  -- One review per user per movie
);
```

## API Endpoints

### GET /api/reviews

Fetch reviews for a movie

**Query Parameters:**

- `movieId` (required) - The TMDB movie ID
- `userId` (optional) - Get specific user's review
- `stats=true` (optional) - Get rating statistics instead of reviews

**Examples:**

```bash
# Get all reviews for a movie
GET /api/reviews?movieId=550

# Get current user's review
GET /api/reviews?movieId=550&userId=auth0|123

# Get rating statistics
GET /api/reviews?movieId=550&stats=true
```

### POST /api/reviews

Create a new review (requires authentication)

**Body:**

```json
{
  "movie_id": 550,
  "rating": 8.5,
  "comment": "Great movie!" // optional
}
```

**Response:**

```json
{
  "success": true,
  "review": {
    "id": "uuid",
    "user_id": "auth0|123",
    "movie_id": 550,
    "rating": 8.5,
    "comment": "Great movie!",
    "created_at": "2025-11-11T12:00:00Z",
    "updated_at": "2025-11-11T12:00:00Z"
  }
}
```

### PUT /api/reviews

Update an existing review (requires authentication)

**Query Parameters:**

- `id` (required) - Review UUID

**Body:**

```json
{
  "rating": 9.0, // optional
  "comment": "Updated review text" // optional
}
```

### DELETE /api/reviews

Delete a review (requires authentication)

**Query Parameters:**

- `id` (required) - Review UUID

## UI Components

### ReviewForm Component

Location: `src/components/ReviewForm.tsx`

Features:

- Interactive star rating (1-10)
- Optional text comment
- Update existing review
- Delete review option

Usage:

```tsx
<ReviewForm
  movieId={123}
  existingReview={userReview}
  onSuccess={() => refreshReviews()}
/>
```

### ReviewsList Component

Location: `src/components/ReviewsList.tsx`

Features:

- Display rating statistics
- List all user reviews
- Formatted dates
- User information

Usage:

```tsx
<ReviewsList movieId={123} refreshTrigger={refreshCount} />
```

### MovieReviewsSection Component

Location: `src/components/MovieReviewsSection.tsx`

Combines ReviewForm and ReviewsList into a complete section.

Usage:

```tsx
<MovieReviewsSection movieId={123} userId={session?.user?.sub} />
```

## Security

### Row Level Security (RLS)

- Anyone can read reviews (public access)
- Only authenticated users can create reviews
- Users can only update/delete their own reviews
- Service role has full access

### Data Validation

- Rating must be between 0 and 10
- One review per user per movie (enforced by unique constraint)
- User must be authenticated to create/update/delete

## How It Works

1. **User visits movie page**

   - If logged in, their existing review (if any) is loaded
   - Review form is pre-filled with their current rating/comment

2. **User submits a review**

   - POST request creates a new review
   - If review already exists, returns 409 error with message to use PUT

3. **Statistics are calculated**

   - Database function `get_movie_stats()` calculates combined rating
   - Weighted average gives more weight to ratings with more votes

4. **Reviews are displayed**
   - All reviews are shown in chronological order (newest first)
   - Each review shows username, rating, comment, and date

## Example Usage Flow

```typescript
// 1. Check if user has reviewed this movie
const userReview = await fetch(`/api/reviews?movieId=550&userId=${userId}`);

// 2. Submit or update review
if (userReview.review) {
  // Update existing
  await fetch(`/api/reviews?id=${userReview.review.id}`, {
    method: "PUT",
    body: JSON.stringify({ rating: 9, comment: "Updated!" }),
  });
} else {
  // Create new
  await fetch("/api/reviews", {
    method: "POST",
    body: JSON.stringify({ movie_id: 550, rating: 9 }),
  });
}

// 3. Fetch statistics
const stats = await fetch("/api/reviews?movieId=550&stats=true");
// Returns: { tmdb_rating, tmdb_count, user_rating, user_count, combined_rating }

// 4. Fetch all reviews
const reviews = await fetch("/api/reviews?movieId=550");
```

## Benefits

1. **User Engagement** - Users can contribute their opinions
2. **Better Ratings** - Combines professional (TMDB) and user ratings
3. **Community Building** - Users can see what others think
4. **Fresh Perspectives** - User reviews can differ from TMDB's international audience
5. **Weighted System** - Popular movies with many TMDB votes aren't dominated by a few user reviews

## Future Enhancements

Possible additions:

- Review likes/helpful votes
- Spoiler warnings
- Review moderation for admins
- Sort reviews by rating/date
- Filter reviews by rating
- Review reply/comment threads
- Rich text formatting for reviews

---

**Date Added**: November 11, 2025
**Status**: ✅ Complete and ready to use!
