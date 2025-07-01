import { NextRequest, NextResponse } from "next/server";
import { MovieSyncService } from "@/lib/services/movieSync";

// Middleware to automatically check and sync movies when needed
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only run sync checks on movie-related API routes or homepage
  const shouldCheckSync =
    pathname.startsWith("/api/movies") ||
    pathname === "/" ||
    pathname.startsWith("/movie/");

  if (shouldCheckSync) {
    try {
      // Check if sync is needed (non-blocking)
      if (MovieSyncService.shouldSync(2)) {
        // 2 hours
        // Trigger background sync without waiting
        // This runs asynchronously and doesn't block the request
        MovieSyncService.syncMoviesToDatabase(2)
          .then((result) => {
            if (result.success) {
              console.log(
                `Background sync completed: ${result.moviesProcessed} movies`
              );
            } else {
              console.error(`Background sync failed: ${result.error}`);
            }
          })
          .catch((error) => {
            console.error("Background sync error:", error);
          });
      }
    } catch (error) {
      // Don't let sync errors affect the main request
      console.error("Middleware sync check error:", error);
    }
  }

  return NextResponse.next();
}

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    "/",
    "/movie/:path*",
    "/api/movies/:path*",
    "/wishlist",
    "/profile",
  ],
};
