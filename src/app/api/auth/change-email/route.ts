import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth/auth0";

/**
 * Change user email via Auth0 Management API
 * This endpoint updates the email in Auth0, which will then sync to Supabase on next login
 */
export async function POST(request: Request) {
  try {
    console.log("=== CHANGE EMAIL REQUEST START ===");
    console.log("Request URL:", request.url);
    console.log("Request headers:", Object.fromEntries(request.headers.entries()));
    
    // Get current user session
    const session = await auth0.getSession();
    console.log("Session object:", session);
    
    if (!session) {
      console.log("❌ No session found");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user?.sub || session.user?.id;
    const currentEmail = session.user?.email;
    
    console.log("Current User ID:", userId);
    console.log("Current Email:", currentEmail);
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found" },
        { status: 400 }
      );
    }

    // Check if user is social login
    const provider = userId.split("|")[0] || "";
    const isSocialLogin = provider.includes("google") || 
                         provider.includes("facebook") || 
                         provider.includes("twitter") ||
                         provider.includes("github");
    
    console.log("Provider:", provider);
    console.log("Is Social Login:", isSocialLogin);
    
    if (isSocialLogin) {
      return NextResponse.json(
        { error: "Cannot change email for social login accounts. Email is managed by your social provider." },
        { status: 400 }
      );
    }

    // Get new email from request body
    const body = await request.json();
    const { newEmail } = body;
    
    console.log("New Email requested:", newEmail);

    if (!newEmail || !newEmail.trim() || !newEmail.includes('@')) {
      return NextResponse.json(
        { error: "Valid email address is required" },
        { status: 400 }
      );
    }

    if (newEmail.toLowerCase() === currentEmail?.toLowerCase()) {
      return NextResponse.json(
        { error: "New email is the same as current email" },
        { status: 400 }
      );
    }

    // Get Auth0 Management API access token
    const domain = process.env.AUTH0_DOMAIN;
    const clientId = process.env.AUTH0_CLIENT_ID;
    const clientSecret = process.env.AUTH0_CLIENT_SECRET;
    const audience = process.env.AUTH0_AUDIENCE;

    console.log("Auth0 Configuration:");
    console.log("- Domain:", domain);
    console.log("- Client ID:", clientId ? "✓" : "✗");
    console.log("- Client Secret:", clientSecret ? "✓" : "✗");
    console.log("- Audience:", audience);

    if (!domain || !clientId || !clientSecret) {
      console.error("❌ Missing Auth0 configuration");
      return NextResponse.json(
        { error: "Auth0 configuration error" },
        { status: 500 }
      );
    }

    // Get Management API token
    console.log("Getting Management API access token...");
    const tokenResponse = await fetch(`https://${domain}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        audience: audience || `https://${domain}/api/v2/`,
      }),
    });

    console.log("Token response status:", tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("❌ Failed to get access token:", errorData);
      return NextResponse.json(
        { error: "Failed to authenticate with Auth0" },
        { status: 500 }
      );
    }

    const { access_token } = await tokenResponse.json();
    console.log("✓ Access token obtained");

    // Update user email via Management API
    console.log(`Updating user ${userId} email to ${newEmail}...`);
    const updateResponse = await fetch(`https://${domain}/api/v2/users/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        email: newEmail.trim(),
        email_verified: false, // User will need to verify new email
      }),
    });

    console.log("Update response status:", updateResponse.status);
    const updateData = await updateResponse.json();
    console.log("Update response data:", updateData);

    if (!updateResponse.ok) {
      console.error("❌ Failed to update email:", updateData);
      
      // Check for specific errors
      if (updateData.message?.includes('email') && updateData.message?.includes('exists')) {
        return NextResponse.json(
          { error: "This email address is already in use by another account" },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          error: "Failed to update email", 
          details: updateData.message || "Unknown error" 
        },
        { status: updateResponse.status }
      );
    }

    console.log("✅ Email updated successfully in Auth0");
    
    // Now update the email in Supabase profiles
    console.log("Updating email in Supabase...");
    const profileUpdateResponse = await fetch(`${request.url.replace('/auth/change-email', '/user/profile')}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        name: session.user.name,
        email: newEmail.trim(),
        profileImageUrl: session.user.picture,
      }),
    });

    if (profileUpdateResponse.ok) {
      console.log("✅ Email updated in Supabase");
    } else {
      console.log("⚠️ Failed to update Supabase, will sync on next login");
    }

    console.log("=== CHANGE EMAIL REQUEST END ===");

    return NextResponse.json({
      success: true,
      message: "Email updated successfully! Please verify your new email address. You may need to log in again.",
      newEmail: newEmail.trim(),
      emailVerified: false,
    });

  } catch (error) {
    console.error("❌ Exception in change-email:", error);
    return NextResponse.json(
      { 
        error: "Failed to change email", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
