import { NextResponse } from "next/server";
import { MovieSyncService } from "@/lib/services/movieSync";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        {
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    console.log("CRON job started: Movie database sync");

    if (!MovieSyncService.shouldSync(2)) {
      console.log("Sync not needed yet, skipping CRON job");
      return NextResponse.json(
        {
          message: "Sync not needed yet",
          status: MovieSyncService.getSyncStatus(),
        },
        { status: 200 }
      );
    }

    const result = await MovieSyncService.syncMoviesToDatabase(3); 

    if (result.success) {
      console.log(
        `CRON sync completed: ${result.moviesProcessed} movies processed`
      );

      return NextResponse.json(
        {
          message: "CRON sync completed successfully",
          moviesProcessed: result.moviesProcessed,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    } else {
      console.error(`CRON sync failed: ${result.error}`);

      return NextResponse.json(
        {
          message: "CRON sync failed",
          error: result.error,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("CRON job error:", error);

    return NextResponse.json(
      {
        message: "CRON job failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
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
        message: "CRON endpoint healthy",
        ...health,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CRON health check failed:", error);

    return NextResponse.json(
      {
        message: "CRON endpoint unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
