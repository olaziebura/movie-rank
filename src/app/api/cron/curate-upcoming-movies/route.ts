import { NextResponse } from "next/server";
import { UpcomingMoviesCurationService } from "@/lib/services/upcomingMoviesCuration";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { message: "Unauthorized access to CRON endpoint" },
        { status: 401 }
      );
    }

    if (!UpcomingMoviesCurationService.shouldCurate(2)) {
      const status = UpcomingMoviesCurationService.getCurationStatus();

      return NextResponse.json(
        {
          message: "Curation not needed yet",
          status,
          nextUpdate: status.nextCurationDue,
        },
        { status: 200 }
      );
    }

    const result = await UpcomingMoviesCurationService.curateUpcomingMovies(4);

    if (result.success) {
      return NextResponse.json(
        {
          message: "CRON curation completed successfully",
          moviesProcessed: result.moviesProcessed,
          featuredMoviesSelected: result.featuredMoviesSelected,
          duration: result.duration,
          timestamp: result.timestamp,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          message: "CRON curation failed",
          error: result.error,
          duration: result.duration,
          timestamp: result.timestamp,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("CRON job error:", error);
    return NextResponse.json(
      {
        message: "CRON job failed unexpectedly",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const status = UpcomingMoviesCurationService.getCurationStatus();

    return NextResponse.json(
      {
        message: "CRON endpoint healthy",
        service: "upcoming-movies-curation",
        status,
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
