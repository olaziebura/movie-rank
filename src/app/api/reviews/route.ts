import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth/auth0";
import {
  createReview,
  updateReview,
  deleteReview,
  getUserReviewForMovie,
  getMovieReviews,
  getMovieStats,
} from "@/lib/supabase/reviews";
import type { CreateReviewInput, UpdateReviewInput } from "@/types/movie";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const movieId = searchParams.get("movieId");
    const userId = searchParams.get("userId");
    const getStats = searchParams.get("stats") === "true";

    if (!movieId) {
      return NextResponse.json(
        { error: "movieId is required" },
        { status: 400 }
      );
    }

    const movieIdNum = parseInt(movieId);

    if (getStats) {
      const stats = await getMovieStats(movieIdNum);
      return NextResponse.json({ success: true, stats });
    }

    if (userId) {
      const review = await getUserReviewForMovie(userId, movieIdNum);
      return NextResponse.json({ success: true, review });
    }

    const reviews = await getMovieReviews(movieIdNum);
    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch reviews",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth0.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.sub;
    const body: CreateReviewInput = await request.json();

    if (!body.movie_id || body.rating === undefined) {
      return NextResponse.json(
        { error: "movie_id and rating are required" },
        { status: 400 }
      );
    }

    if (body.rating < 0 || body.rating > 10) {
      return NextResponse.json(
        { error: "rating must be between 0 and 10" },
        { status: 400 }
      );
    }

    const review = await createReview(userId, body);

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      return NextResponse.json(
        {
          error:
            "You have already reviewed this movie. Use PUT to update your review.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create review",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth0.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.sub;
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get("id");

    if (!reviewId) {
      return NextResponse.json(
        { error: "Review ID is required" },
        { status: 400 }
      );
    }

    const body: UpdateReviewInput = await request.json();

    if (body.rating !== undefined && (body.rating < 0 || body.rating > 10)) {
      return NextResponse.json(
        { error: "rating must be between 0 and 10" },
        { status: 400 }
      );
    }

    const review = await updateReview(userId, reviewId, body);

    return NextResponse.json({ success: true, review });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update review",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth0.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.sub;
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get("id");

    if (!reviewId) {
      return NextResponse.json(
        { error: "Review ID is required" },
        { status: 400 }
      );
    }

    await deleteReview(userId, reviewId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete review",
      },
      { status: 500 }
    );
  }
}
