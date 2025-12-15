import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth/auth0";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Check authentication
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.sub ?? session.user.id;
    const { id } = await context.params;

    // Fetch wishlist
    const { data: wishlist, error } = await supabaseAdmin
      .from("wishlists")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error || !wishlist) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      wishlist,
    });
  } catch (error) {
    console.error("Error in GET /api/wishlists/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    // Check authentication
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.sub ?? session.user.id;
    const { id } = await context.params;
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Wishlist name is required" },
        { status: 400 }
      );
    }

    // Update wishlist
    const { data, error } = await supabaseAdmin
      .from("wishlists")
      .update({ name: name.trim() })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating wishlist:", error);
      return NextResponse.json(
        { error: "Failed to update wishlist" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      wishlist: data,
    });
  } catch (error) {
    console.error("Error in PATCH /api/wishlists/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // Check authentication
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.sub ?? session.user.id;
    const { id } = await context.params;

    // Delete wishlist (cascade will delete items)
    const { error } = await supabaseAdmin
      .from("wishlists")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting wishlist:", error);
      return NextResponse.json(
        { error: "Failed to delete wishlist" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Wishlist deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/wishlists/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
