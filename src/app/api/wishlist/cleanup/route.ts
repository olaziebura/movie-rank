import { NextResponse } from "next/server";
import { cleanupWishlistDuplicates } from "@/lib/supabase/wishlist";
import { auth0 } from '@/lib/auth/auth0';

export async function POST() {
  try {
    // Get user session to ensure they're authenticated
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user?.org_id ?? session.user?.sub ?? session.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 400 }
      );
    }

    const cleanedWishlist = await cleanupWishlistDuplicates(userId);
    
    return NextResponse.json({
      success: true,
      message: "Wishlist duplicates cleaned up successfully",
      wishlist: cleanedWishlist,
      count: cleanedWishlist.length
    });
  } catch (error) {
    console.error("Error cleaning up wishlist duplicates:", error);
    return NextResponse.json(
      { error: "Failed to cleanup wishlist duplicates" },
      { status: 500 }
    );
  }
}
