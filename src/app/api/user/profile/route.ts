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
    const session = await auth0.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user?.sub || session.user?.id;
    console.log("PUT Profile - User ID:", userId);
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, profileImageUrl } = body;
    console.log("PUT Profile - Request body:", { name, profileImageUrl });

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
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
    const updatedProfile = {
      ...currentProfile,
      name: name.trim(),
      profile_image_url: profileImageUrl?.trim() || currentProfile.profile_image_url,
    };

    console.log("PUT Profile - Updated profile:", updatedProfile);
    const result = await updateProfile(userId, updatedProfile);
    console.log("PUT Profile - Update result:", result);
    
    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to update profile", details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
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
