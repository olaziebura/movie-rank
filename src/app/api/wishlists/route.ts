import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth/auth0";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.sub ?? session.user.id;

    // Parse request body
    const body = await request.json();
    const { name } = body;

    // Validate input
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Wishlist name is required" },
        { status: 400 }
      );
    }

    // Create wishlist in database
    const { data, error } = await supabaseAdmin
      .from("wishlists")
      .insert([
        {
          user_id: userId,
          name: name.trim(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating wishlist:", error);
      return NextResponse.json(
        { error: "Failed to create wishlist" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      wishlist: data,
    });
  } catch (error) {
    console.error("Error in POST /api/wishlists:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.sub ?? session.user.id;

    // Fetch user's wishlists
    const { data: wishlists, error: wishlistsError } = await supabaseAdmin
      .from("wishlists")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (wishlistsError) {
      console.error("Error fetching wishlists:", wishlistsError);
      return NextResponse.json(
        { error: "Failed to fetch wishlists" },
        { status: 500 }
      );
    }

    // Add movie_count to each wishlist based on movie_ids array length
    const wishlistsWithCount = wishlists.map((wishlist: any) => ({
      ...wishlist,
      movie_count: (wishlist.movie_ids || []).length,
    }));

    return NextResponse.json({
      success: true,
      wishlists: wishlistsWithCount,
    });
  } catch (error) {
    console.error("Error in GET /api/wishlists:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
