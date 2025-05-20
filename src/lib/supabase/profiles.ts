import type { SessionData } from "@auth0/nextjs-auth0/types";
import { supabase } from "./supabase";
import type { UserProfile } from "@/types/user";

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.warn("Error fetching profile:", error);
    return null;
  }
  return data;
}

export async function updateProfile(userId: string, profile: UserProfile) {
  const { data, error } = await supabase
    .from("profiles")
    .update(profile)
    .eq("id", userId);

  if (error) {
    console.error("Error updating profile:", error);
    return { success: false, error };
  }
  return { success: true, data };
}

export async function upsertProfileFromAuth0Session(
  session: SessionData | null
) {
  const userId = session?.user?.sub || session?.user?.id;

  if (!userId) {
    console.error("No user ID found in session:", session);
    return { created: false, profile: null, error: "No user ID found" };
  }

  const email = session.user.email || "";
  const name = session.user.name || session.user.nickname || "";

  try {
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    console.log("Fetch result:", { existingProfile, fetchError });

    if (!existingProfile) {
      console.log(`Creating new profile for user: ${userId}`);

      const newProfile = {
        id: userId,
        email,
        name,
        wishlist: [],
      };

      console.log("About to insert profile:", newProfile);

      const { data, error: insertError } = await supabase
        .from("profiles")
        .insert([newProfile])
        .select();

      if (insertError) {
        console.error("Error inserting profile:", insertError);
        return { created: false, profile: null, error: insertError };
      }

      console.log("Successfully created profile:", data);
      return { created: true, profile: data?.[0] || null };
    }

    console.log("Found existing profile:", existingProfile);
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({ email, name })
      .eq("id", userId)
      .select();

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return { created: false, profile: existingProfile, error: updateError };
    }

    console.log("Profile updated:", updatedProfile);
    return { created: false, profile: updatedProfile?.[0] ?? null };
  } catch (error) {
    console.error("Error in upsertProfileFromAuth0Session:", error);
    return { created: false, profile: null, error };
  }
}
