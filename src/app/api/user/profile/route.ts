import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth/auth0";
import { getProfile, updateProfile } from "@/lib/supabase/profiles";

export async function GET() {
  try {
    const session = await auth0.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user?.sub || session.user?.id;
    console.log("GET Profile - User ID:", userId);
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 400 }
      );
    }

    const profile = await getProfile(userId);
    console.log("GET Profile - Retrieved profile:", profile);
    
    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    console.log("=== UPDATE PROFILE START ===");
    const session = await auth0.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user?.sub || session.user?.id;
    const userProvider = userId?.split("|")[0] || "";
    const isSocialLogin = userProvider.includes("google") || 
                         userProvider.includes("facebook") || 
                         userProvider.includes("twitter") ||
                         userProvider.includes("github");
    
    console.log("PUT Profile - User ID:", userId);
    console.log("PUT Profile - Provider:", userProvider);
    console.log("PUT Profile - Is Social Login:", isSocialLogin);
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, email, profileImageUrl } = body;
    console.log("PUT Profile - Request body:", { name, email, profileImageUrl });

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Only validate email for non-social login users
    if (!isSocialLogin) {
      if (!email || !email.trim() || !email.includes('@')) {
        return NextResponse.json(
          { error: "Valid email is required" },
          { status: 400 }
        );
      }
    }

    // Get current profile
    const currentProfile = await getProfile(userId);
    console.log("PUT Profile - Current profile:", currentProfile);
    
    if (!currentProfile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Update profile with new data
    // For social login, keep the existing email
    const updatedProfile = {
      ...currentProfile,
      name: name.trim(),
      email: isSocialLogin ? currentProfile.email : email.trim(),
      profile_image_url: profileImageUrl?.trim() || currentProfile.profile_image_url,
    };

    console.log("PUT Profile - Updated profile data:", updatedProfile);
    const result = await updateProfile(userId, updatedProfile);
    console.log("PUT Profile - Update result:", result);
    
    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to update profile", details: result.error },
        { status: 500 }
      );
    }

    // Fetch the updated profile to return the latest data
    const refreshedProfile = await getProfile(userId);
    console.log("PUT Profile - Refreshed profile:", refreshedProfile);
    console.log("=== UPDATE PROFILE END ===");

    return NextResponse.json({
      success: true,
      profile: refreshedProfile || updatedProfile,
      ...(result.warning && { warning: result.warning }),
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
