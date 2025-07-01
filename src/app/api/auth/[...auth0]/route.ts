import { NextRequest, NextResponse } from "next/server";

// Temporary stub implementation for Auth0 routes
// This will allow the build to succeed while Auth0 configuration is being resolved

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Extract the auth action from the URL
  const segments = pathname.split('/');
  const action = segments[segments.length - 1];
  
  console.log('Auth0 route called:', action);
  
  // For now, return a simple response indicating the route was called
  // In a real implementation, this would handle login, logout, callback, etc.
  return NextResponse.json({ 
    message: `Auth0 ${action} route called`,
    action,
    pathname 
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
