import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth/auth0";

export async function POST() {
  try {
    console.log("=== PASSWORD CHANGE REQUEST START ===");
    const session = await auth0.getSession();
    
    if (!session) {
      console.log("❌ No session found");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const email = session.user.email;
    const sub = session.user.sub || "";
    const provider = sub.split("|")[0] || "";
    
    console.log("User info:", { email, sub, provider });
    
    if (!email) {
      console.log("❌ No email in session");
      return NextResponse.json(
        { error: "Email not found in session" },
        { status: 400 }
      );
    }

    // Check if user is using social login
    const isSocialLogin = provider.includes("google") || 
                         provider.includes("facebook") || 
                         provider.includes("twitter") ||
                         provider.includes("github");

    if (isSocialLogin) {
      console.log("❌ Social login detected:", provider);
      return NextResponse.json(
        { error: "Cannot change password for social login accounts" },
        { status: 400 }
      );
    }

    // Trigger password change email from Auth0
    const domain = process.env.AUTH0_ISSUER_BASE_URL?.replace('https://', '') || process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
    const clientId = process.env.AUTH0_CLIENT_ID;

    console.log("Auth0 config:", { domain: domain ? "✓" : "✗", clientId: clientId ? "✓" : "✗" });

    if (!domain || !clientId) {
      console.error("❌ Missing Auth0 configuration");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const requestBody = {
      client_id: clientId,
      email: email,
      connection: 'Username-Password-Authentication',
    };

    console.log("Sending password reset request to Auth0:", { 
      url: `https://${domain}/dbconnections/change_password`,
      email,
      connection: 'Username-Password-Authentication'
    });

    // Call Auth0 API to trigger password reset
    const response = await fetch(`https://${domain}/dbconnections/change_password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log("Auth0 response status:", response.status);
    console.log("Auth0 response body:", responseText);

    if (!response.ok) {
      console.error("❌ Auth0 password change error");
      console.error("Response:", responseText);
      
      // Try to parse error message
      try {
        const errorData = JSON.parse(responseText);
        console.error("Error details:", errorData);
        
        // Check if it's a connection name issue
        if (errorData.error === 'invalid_request' || errorData.statusCode === 400) {
          return NextResponse.json(
            { 
              error: "Unable to send password reset email. Your account may not support password changes through this method. Please contact support.",
              details: errorData.message || errorData.error
            },
            { status: 400 }
          );
        }
      } catch (e) {
        // Response is not JSON
      }
      
      return NextResponse.json(
        { error: "Failed to send password reset email. Please try again or contact support." },
        { status: 500 }
      );
    }

    console.log("✅ Password reset email sent successfully");
    console.log("=== PASSWORD CHANGE REQUEST END ===");
    
    return NextResponse.json({
      success: true,
      message: "Password reset email sent successfully. Please check your email.",
    });
  } catch (error) {
    console.error("❌ Exception in password change:", error);
    return NextResponse.json(
      { error: "Failed to request password change" },
      { status: 500 }
    );
  }
}
