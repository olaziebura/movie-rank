import { getProfile, updateProfile } from "./profiles";
import { supabase } from "./supabase";
import { MovieRankError, ErrorType } from "@/lib/utils/errorHandler";

/**
 * Ensures a user profile exists, creating a basic one if it doesn't
 * @param userId - User ID
 * @returns Promise resolving to user profile
 */
async function ensureProfileExists(userId: string) {
  let profile = await getProfile(userId);

  if (!profile) {
    const newProfile = {
      id: userId,
      email: null,
      name: null,
      wishlist: [],
      // admin: false, // Temporarily commented out until schema migration is applied
    };

    const { data, error } = await supabase
      .from("profiles")
      .insert([newProfile])
      .select()
      .single();

    if (error) {
      throw new MovieRankError(
        ErrorType.DATABASE_ERROR,
        "Failed to create user profile",
        500,
        "PROFILE_CREATE_ERROR",
        { userId }
      );
    }

    // Add admin field with default value to the returned profile for consistency
    profile = data ? { ...data, admin: false } : null;
  }

  return profile;
}

/**
 * Adds a movie to user's wishlist.
 * @param userId - User ID
 * @param movieId - Movie ID to add
 * @returns Promise resolving to updated wishlist array
 * @throws {MovieRankError} When profile is not found or update fails
 */
export async function addMovieToWishlist(
  userId: string,
  movieId: number
): Promise<number[]> {
  try {
    const profile = await ensureProfileExists(userId);
    if (!profile) {
      throw new MovieRankError(
        ErrorType.NOT_FOUND_ERROR,
        "User profile not found",
        404,
        "PROFILE_NOT_FOUND",
        { userId }
      );
    }

    const currentWishlist = profile.wishlist || [];
    
    // Normalize wishlist to numbers and remove duplicates
    const normalizedWishlist = [...new Set(
      currentWishlist.map((id: number | string) => typeof id === 'string' ? parseInt(id, 10) : id)
    )].filter(id => !isNaN(id));

    // Check if movie is already in wishlist (convert movieId to number to be safe)
    const movieIdNum = typeof movieId === 'string' ? parseInt(movieId, 10) : movieId;
    
    if (!normalizedWishlist.includes(movieIdNum)) {
      normalizedWishlist.push(movieIdNum);
    }

    await updateProfile(userId, { ...profile, wishlist: normalizedWishlist });
    return normalizedWishlist;
  } catch (error) {
    if (error instanceof MovieRankError) {
      throw error;
    }

    throw new MovieRankError(
      ErrorType.DATABASE_ERROR,
      "Failed to add movie to wishlist",
      500,
      "WISHLIST_ADD_ERROR",
      { userId, movieId },
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Removes a movie from user's wishlist.
 * @param userId - User ID
 * @param movieId - Movie ID to remove
 * @returns Promise resolving to updated wishlist array
 * @throws {MovieRankError} When profile is not found or update fails
 */
export async function removeMovieFromWishlist(
  userId: string,
  movieId: number
): Promise<number[]> {
  try {
    const profile = await ensureProfileExists(userId);
    if (!profile) {
      throw new MovieRankError(
        ErrorType.NOT_FOUND_ERROR,
        "User profile not found",
        404,
        "PROFILE_NOT_FOUND",
        { userId }
      );
    }

    const currentWishlist = profile.wishlist || [];
    
    // Normalize wishlist to numbers and remove duplicates
    const normalizedWishlist = [...new Set(
      currentWishlist.map((id: number | string) => typeof id === 'string' ? parseInt(id, 10) : id)
    )].filter(id => !isNaN(id));
    
    // Convert movieId to number to be safe and filter it out
    const movieIdNum = typeof movieId === 'string' ? parseInt(movieId, 10) : movieId;
    const updatedWishlist = normalizedWishlist.filter(id => id !== movieIdNum);

    await updateProfile(userId, { ...profile, wishlist: updatedWishlist });
    return updatedWishlist;
  } catch (error) {
    if (error instanceof MovieRankError) {
      throw error;
    }

    throw new MovieRankError(
      ErrorType.DATABASE_ERROR,
      "Failed to remove movie from wishlist",
      500,
      "WISHLIST_REMOVE_ERROR",
      { userId, movieId },
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Cleans up duplicate movie IDs in a user's wishlist and normalizes data types
 * @param userId - User ID
 * @returns Promise resolving to cleaned wishlist array
 * @throws {MovieRankError} When profile is not found or update fails
 */
export async function cleanupWishlistDuplicates(userId: string): Promise<number[]> {
  try {
    const profile = await ensureProfileExists(userId);
    if (!profile) {
      throw new MovieRankError(
        ErrorType.NOT_FOUND_ERROR,
        "User profile not found",
        404,
        "PROFILE_NOT_FOUND",
        { userId }
      );
    }

    const currentWishlist = profile.wishlist || [];
    
    // Normalize wishlist to numbers and remove duplicates
    const cleanedWishlist = [...new Set(
      currentWishlist.map((id: number | string) => typeof id === 'string' ? parseInt(id, 10) : id)
    )].filter(id => !isNaN(id));

    // Only update if there were duplicates or type issues
    if (cleanedWishlist.length !== currentWishlist.length || 
        JSON.stringify(cleanedWishlist) !== JSON.stringify(currentWishlist)) {
      await updateProfile(userId, { ...profile, wishlist: cleanedWishlist });
    }

    return cleanedWishlist;
  } catch (error) {
    if (error instanceof MovieRankError) {
      throw error;
    }

    throw new MovieRankError(
      ErrorType.DATABASE_ERROR,
      "Failed to cleanup wishlist duplicates",
      500,
      "WISHLIST_CLEANUP_ERROR",
      { userId },
      error instanceof Error ? error : undefined
    );
  }
}
