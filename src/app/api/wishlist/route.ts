import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/supabase/profiles";
import { addMovieToWishlist, removeMovieFromWishlist } from "@/lib/supabase/wishlist";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const profile = await getProfile(userId);

    return NextResponse.json({
      success: true,
      wishlist: profile?.wishlist || [],
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch wishlist" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, movieId } = body;

    if (!userId || !movieId) {
      return NextResponse.json(
        { error: "User ID and Movie ID are required" },
        { status: 400 }
      );
    }

    const wishlist = await addMovieToWishlist(userId, movieId);

    return NextResponse.json({
      success: true,
      wishlist,
    });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return NextResponse.json(
      { error: "Failed to add movie to wishlist" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, movieId } = body;

    if (!userId || !movieId) {
      return NextResponse.json(
        { error: "User ID and Movie ID are required" },
        { status: 400 }
      );
    }

    const wishlist = await removeMovieFromWishlist(userId, movieId);

    return NextResponse.json({
      success: true,
      wishlist,
    });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return NextResponse.json(
      { error: "Failed to remove movie from wishlist" },
      { status: 500 }
    );
  }
}
