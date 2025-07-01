import { NextResponse } from "next/server";
import { MovieSyncService } from "@/lib/services/movieSync";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { force = false, maxPages = 3 } = body;

    if (!force && !MovieSyncService.shouldSync()) {
      const status = MovieSyncService.getSyncStatus();
      return NextResponse.json(
        {
          message: "Sync not needed yet",
          status,
          nextSyncDue: status.nextSyncDue,
        },
        { status: 200 }
      );
    }

    const result = await MovieSyncService.syncMoviesToDatabase(maxPages);

    if (result.success) {
      return NextResponse.json(
        {
          message: "Movies synced successfully",
          moviesProcessed: result.moviesProcessed,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          message: "Sync failed",
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in sync API:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const health = await MovieSyncService.getDatabaseHealth();

    return NextResponse.json(
      {
        status: "ok",
        ...health,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting sync status:", error);
    return NextResponse.json(
      {
        message: "Failed to get sync status",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
