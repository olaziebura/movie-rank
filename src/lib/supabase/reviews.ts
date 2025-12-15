import { supabaseAdmin } from "./supabaseAdmin";
import type {
  Review,
  ReviewWithUser,
  CreateReviewInput,
  UpdateReviewInput,
  MovieStats,
} from "@/types/movie";

export async function createReview(
  userId: string,
  input: CreateReviewInput
): Promise<Review> {
  // Use supabaseAdmin to bypass RLS since we're using Auth0 authentication
  const { data, error } = await supabaseAdmin
    .from("reviews")
    .insert({
      user_id: userId,
      movie_id: input.movie_id,
      rating: input.rating,
      comment: input.comment || null,
      is_public: input.is_public ?? true, // Default to public
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateReview(
  userId: string,
  reviewId: string,
  input: UpdateReviewInput
): Promise<Review> {
  const updateData: {
    rating?: number;
    comment?: string | null;
    is_public?: boolean;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (input.rating !== undefined) {
    updateData.rating = input.rating;
  }

  if (input.comment !== undefined) {
    updateData.comment = input.comment || null;
  }

  if (input.is_public !== undefined) {
    updateData.is_public = input.is_public;
  }

  const { data, error } = await supabaseAdmin
    .from("reviews")
    .update(updateData)
    .eq("id", reviewId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteReview(
  userId: string,
  reviewId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function getUserReviewForMovie(
  userId: string,
  movieId: number
): Promise<Review | null> {
  const { data, error } = await supabaseAdmin
    .from("reviews")
    .select("*")
    .eq("user_id", userId)
    .eq("movie_id", movieId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data;
}

export async function getMovieReviews(
  movieId: number,
  limit = 20,
  requestingUserId?: string | null
): Promise<ReviewWithUser[]> {
  const { data, error } = await supabaseAdmin.rpc("get_movie_reviews", {
    movie_id_param: movieId,
    limit_count: limit,
    requesting_user_id: requestingUserId || null,
  });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getMovieStats(
  movieId: number
): Promise<MovieStats | null> {
  const { data, error } = await supabaseAdmin
    .rpc("get_movie_stats", {
      movie_id_param: movieId,
    })
    .single();

  if (error) {
    throw error;
  }

  return data as MovieStats | null;
}

export async function getAllReviewsByUser(
  userId: string,
  limit = 50
): Promise<ReviewWithUser[]> {
  const { data, error } = await supabaseAdmin
    .from("reviews")
    .select(
      `
      *,
      profiles:user_id (
        name,
        email
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (
    data?.map((review) => ({
      ...review,
      is_public: review.is_public ?? true,
      user_name: review.profiles?.name || "",
      user_email: review.profiles?.email || "",
    })) || []
  );
}

export async function getPrivateReviewsByUser(
  userId: string,
  limit = 50
): Promise<Review[]> {
  const { data, error } = await supabaseAdmin
    .from("reviews")
    .select("*")
    .eq("user_id", userId)
    .eq("is_public", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data || [];
}
