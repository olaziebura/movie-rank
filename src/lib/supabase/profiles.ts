import type { SessionData } from "@auth0/nextjs-auth0/types";
import { supabaseAdmin } from "./supabaseAdmin";
import type { UserProfile } from "@/types/user";

/**
 * Retrieves user profile by ID.
 * @param userId - User ID to fetch profile for
 * @returns Promise resolving to user profile or null if not found
 */
export async function getProfile(userId: string): Promise<UserProfile | null> {
  // Validate userId
  if (!userId || userId === 'undefined' || userId === 'null') {
    console.warn('getProfile called with invalid userId:', userId);
    return null;
  }

  try {
    // Use supabaseAdmin to bypass RLS since we're using Auth0 authentication
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Profile not found - this is not an error, just return null
        return null;
      }

      // Log the error with full context but don't throw - return null instead
      console.error('[ Server ] Supabase error in getProfile:', {
        userId,
        error: JSON.stringify(error, null, 2),
        errorString: String(error),
        errorKeys: Object.keys(error),
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // Return null instead of throwing to prevent app crashes
      return null;
    }

    return data;
  } catch (error) {
    // Log unexpected errors but don't throw
    console.error('Unexpected error in getProfile:', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Return null to allow the app to continue functioning
    return null;
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
    // Use supabaseAdmin to bypass RLS since we're using Auth0 authentication
    const { data, error } = await supabaseAdmin
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
        const { data: retryData, error: retryError } = await supabaseAdmin
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
    // Use supabaseAdmin to bypass RLS since we're using Auth0 authentication
    const { data: existingProfile } = await supabaseAdmin
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

      const { data, error: insertError } = await supabaseAdmin
        .from("profiles")
        .insert([newProfile])
        .select();

      if (insertError) {
        return { created: false, profile: null, error: insertError };
      }

      const profileWithAdmin = data?.[0] ? { ...data[0], admin: false } : null;
      return { created: true, profile: profileWithAdmin };
    }

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
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
      return {
        success: false,
        error: "User profile not found",
      };
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
