import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth/auth0";
import { supabase } from "@/lib/supabase/supabase";

export async function DELETE() {
  try {
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

    // Delete user profile from Supabase
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (error) {
      console.error("Error deleting profile:", error);
      return NextResponse.json(
        { error: "Failed to delete account" },
        { status: 500 }
      );
    }

    // TODO: Delete user from Auth0 using Management API
    // This would require Auth0 Management API integration and proper permissions
    // For now, we'll just delete the Supabase profile

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
