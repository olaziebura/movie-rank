import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth/auth0";

export async function GET() {
  try {
    const session = await auth0.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Detect authentication provider from sub field
    // Format: "provider|id" (e.g., "google-oauth2|123456" or "auth0|123456")
    const sub = session.user.sub || "";
    const provider = sub.split("|")[0] || "unknown";
    
    // Determine if this is a social login
    const isSocialLogin = provider.includes("google") || 
                         provider.includes("facebook") || 
                         provider.includes("twitter") ||
                         provider.includes("github");
    
    const isEmailPasswordLogin = provider === "auth0";

    return NextResponse.json({
      sub: session.user.sub,
      name: session.user.name,
      email: session.user.email,
      picture: session.user.picture,
      provider: provider,
      isSocialLogin: isSocialLogin,
      isEmailPasswordLogin: isEmailPasswordLogin,
    });
  } catch (error) {
    console.error("Error fetching user session:", error);
    return NextResponse.json(
      { error: "Failed to fetch user session" },
      { status: 500 }
    );
  }
}
