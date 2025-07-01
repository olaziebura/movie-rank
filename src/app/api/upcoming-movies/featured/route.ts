import { NextResponse } from "next/server";
import {
  getFeaturedUpcomingMovies,
  getFeaturedUpcomingStats,
  type FeaturedUpcomingMovie,
  type FeaturedUpcomingSortBy,
  type SortOrder,
} from "@/lib/supabase/upcomingMovies";
import { UpcomingMoviesCurationService } from "@/lib/services/upcomingMoviesCuration";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const sortBy = (searchParams.get("sortBy") ||
      "rank") as FeaturedUpcomingSortBy;
    const sortOrder = (searchParams.get("sortOrder") || "asc") as SortOrder;
    const limit = parseInt(searchParams.get("limit") || "10");
    const includeStats = searchParams.get("includeStats") === "true";

    const validSortOptions: FeaturedUpcomingSortBy[] = [
      "rank",
      "curation_score",
      "vote_average",
      "popularity",
      "release_date",
    ];
    const validSortOrders: SortOrder[] = ["asc", "desc"];

    if (!validSortOptions.includes(sortBy)) {
      return NextResponse.json(
        {
          message: `Invalid sortBy parameter. Must be one of: ${validSortOptions.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    if (!validSortOrders.includes(sortOrder)) {
      return NextResponse.json(
        {
          message: `Invalid sortOrder parameter. Must be one of: ${validSortOrders.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 20) {
      return NextResponse.json(
        {
          message: "Limit must be between 1 and 20",
        },
        { status: 400 }
      );
    }

    const result = await getFeaturedUpcomingMovies(sortBy, sortOrder, limit);

    if (!result.success) {
      return NextResponse.json(
        {
          message: "Failed to fetch featured upcoming movies",
          error: result.error,
        },
        { status: 500 }
      );
    }

    interface ResponseType {
      success: boolean;
      movies: FeaturedUpcomingMovie[];
      count: number;
      sortBy: string;
      sortOrder: string;
      timestamp: string;
      stats?: {
        totalFeatured: number;
        lastUpdated: string | null;
        averageRating: number;
        averagePopularity: number;
        genreDistribution: { [key: number]: number };
      };
    }

    const response: ResponseType = {
      success: true,
      movies: result.movies,
      count: result.movies.length,
      sortBy,
      sortOrder,
      timestamp: new Date().toISOString(),
    };

    if (includeStats) {
      const statsResult = await getFeaturedUpcomingStats();
      if (statsResult.success) {
        response.stats = {
          totalFeatured: statsResult.totalFeatured,
          lastUpdated: statsResult.lastUpdated,
          averageRating: statsResult.averageRating,
          averagePopularity: statsResult.averagePopularity,
          genreDistribution: statsResult.genreDistribution,
        };
      }
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error in featured upcoming movies API:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { force = false, maxPages = 5 } = body;

    if (typeof maxPages !== "number" || maxPages < 1 || maxPages > 10) {
      return NextResponse.json(
        {
          message: "maxPages must be a number between 1 and 10",
        },
        { status: 400 }
      );
    }

    console.log(
      `🎬 Manual curation triggered (force: ${force}, maxPages: ${maxPages})`
    );

    const result = force
      ? await UpcomingMoviesCurationService.forceCuration(maxPages)
      : await UpcomingMoviesCurationService.curateUpcomingMovies(maxPages);

    if (result.success) {
      return NextResponse.json(
        {
          message: "Curation completed successfully",
          ...result,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          message: "Curation failed",
          ...result,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in manual curation:", error);
    return NextResponse.json(
      {
        message: "Failed to trigger curation",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT() {
  try {
    return NextResponse.json(
      {
        message: "Curation settings update not yet implemented",
        supportedMethods: ["GET", "POST"],
      },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error in curation settings update:", error);
    return NextResponse.json(
      {
        message: "Failed to update curation settings",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
