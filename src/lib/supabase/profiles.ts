import type { SessionData } from "@auth0/nextjs-auth0/types";
import { supabaseAdmin } from "./supabaseAdmin";
import type { UserProfile } from "@/types/user";

export async function getProfile(userId: string): Promise<UserProfile | null> {
  if (!userId || userId === 'undefined' || userId === 'null') {
    return null;
  }

  const maxRetries = 3;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }

        lastError = error;
        
        if (error.code && error.code !== '') {
          break;
        }
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 100 * attempt));
          continue;
        }
      } else {
        return data;
      }
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
        continue;
      }
    }
  }

  console.error('Supabase error in getProfile after retries:', lastError);
  return null;
}

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
      if (error.code === 'PGRST204' && error.message?.includes('profile_image_url')) {
        const { data: retryData, error: retryError } = await supabaseAdmin
          .from("profiles")
          .update(profile)
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
