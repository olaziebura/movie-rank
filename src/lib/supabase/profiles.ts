import type { SessionData } from "@auth0/nextjs-auth0/types";
import { supabase } from "./supabase";
import type { UserProfile } from "@/types/user";
import { MovieRankError, ErrorType } from "@/lib/utils/errorHandler";

/**
 * Retrieves user profile by ID.
 * @param userId - User ID to fetch profile for
 * @returns Promise resolving to user profile or null if not found
 */
export async function getProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }

      throw new MovieRankError(
        ErrorType.DATABASE_ERROR,
        "Failed to fetch user profile",
        500,
        "PROFILE_FETCH_ERROR",
        { userId, supabaseError: error.message }
      );
    }

    return data;
  } catch (error) {
    if (error instanceof MovieRankError) {
      throw error;
    }

    throw new MovieRankError(
      ErrorType.DATABASE_ERROR,
      "Unexpected error fetching profile",
      500,
      "PROFILE_FETCH_UNEXPECTED_ERROR",
      { userId },
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Updates user profile.
 * @param userId - User ID to update profile for
 * @param profile - Profile data to update
 * @returns Promise resolving to update result
 */
export async function updateProfile(
  userId: string,
  profile: UserProfile
): Promise<{ success: boolean; data?: unknown; error?: unknown; warning?: string }> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update(profile)
      .eq("id", userId);

    if (error) {
      // Handle the case where profile_image_url column doesn't exist yet
      if (error.code === 'PGRST204' && error.message?.includes('profile_image_url')) {
        console.warn('profile_image_url column not found, skipping image update. Please run the SQL migration.');
        // Try updating without the profile_image_url field
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { profile_image_url, ...profileWithoutImage } = profile;
        const { data: retryData, error: retryError } = await supabase
          .from("profiles")
          .update(profileWithoutImage)
          .eq("id", userId);
        
        if (retryError) {
          return { success: false, error: retryError };
        }
        return { 
          success: true, 
          data: retryData, 
          warning: 'Profile updated but image URL was skipped due to missing column' 
        };
      }
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Creates or updates user profile from Auth0 session data.
 * @param session - Auth0 session data
 * @returns Promise resolving to operation result with profile data
 */
export async function upsertProfileFromAuth0Session(
  session: SessionData | null
): Promise<{
  created: boolean;
  profile: UserProfile | null;
  error?: unknown;
}> {
  const userId = session?.user?.sub || session?.user?.id;

  if (!userId) {
    return {
      created: false,
      profile: null,
      error: "No user ID found in session",
    };
  }

  const email = session.user.email || "";
  const name = session.user.name || session.user.nickname || "";

  try {
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!existingProfile) {
      const newProfile = {
        id: userId,
        email,
        name,
        wishlist: [],
      };

      const { data, error: insertError } = await supabase
        .from("profiles")
        .insert([newProfile])
        .select();

      if (insertError) {
        return { created: false, profile: null, error: insertError };
      }

      const profileWithAdmin = data?.[0] ? { ...data[0], admin: false } : null;
      return { created: true, profile: profileWithAdmin };
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({ email, name })
      .eq("id", userId)
      .select();

    if (updateError) {
      return { created: false, profile: existingProfile, error: updateError };
    }

    return { created: false, profile: updatedProfile?.[0] ?? null };
  } catch (error) {
    return { created: false, profile: null, error };
  }
}

/**
 * Checks if a user has admin privileges.
 * @param userId - User ID to check admin status for
 * @returns Promise resolving to true if user is admin, false otherwise
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const profile = await getProfile(userId);

    if (!profile) {
      return false;
    }

    // Handle case where admin column doesn't exist yet (before schema migration)
    const isAdmin = profile.admin === true;

    return isAdmin;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Sets admin status for a user (only for development/initial setup).
 * @param userId - User ID to update admin status for
 * @param isAdmin - Admin status to set
 * @returns Promise resolving to update result
 */
export async function setUserAdminStatus(
  userId: string,
  isAdmin: boolean
): Promise<{ success: boolean; error?: unknown }> {
  try {
    const profile = await getProfile(userId);

    if (!profile) {
      throw new MovieRankError(
        ErrorType.NOT_FOUND_ERROR,
        "User profile not found",
        404,
        "PROFILE_NOT_FOUND",
        { userId }
      );
    }

    const updatedProfile = { ...profile, admin: isAdmin };
    const result = await updateProfile(userId, updatedProfile);

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
