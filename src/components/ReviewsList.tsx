"use client";

import { useEffect, useState } from "react";
import { Star, User } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ReviewWithUser, MovieStats } from "@/types/movie";

interface ReviewsListProps {
  movieId: number;
  refreshTrigger?: number;
}

export function ReviewsList({ movieId, refreshTrigger = 0 }: ReviewsListProps) {
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [stats, setStats] = useState<MovieStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviewsAndStats = async () => {
      setIsLoading(true);
      try {
        const [reviewsRes, statsRes] = await Promise.all([
          fetch(`/api/reviews?movieId=${movieId}`),
          fetch(`/api/reviews?movieId=${movieId}&stats=true`),
        ]);

        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setReviews(reviewsData.reviews || []);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.stats);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviewsAndStats();
  }, [movieId, refreshTrigger]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading reviews...</div>;
  }

  return (
    <div className="space-y-6">
      {stats && (
        <Card>
          <CardHeader>
            <h3 className="text-xl font-bold">Rating Statistics</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">TMDB Rating</p>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-2xl font-bold">
                    {stats.tmdb_rating.toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-600">
                    ({stats.tmdb_count.toLocaleString()} votes)
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">User Reviews</p>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-blue-400 text-blue-400" />
                  <span className="text-2xl font-bold">
                    {stats.user_count > 0
                      ? stats.user_rating.toFixed(1)
                      : "N/A"}
                  </span>
                  <span className="text-sm text-gray-600">
                    ({stats.user_count}{" "}
                    {stats.user_count === 1 ? "review" : "reviews"})
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Combined Rating</p>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-green-400 text-green-400" />
                  <span className="text-2xl font-bold">
                    {stats.combined_rating.toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-600">
                    ({(stats.tmdb_count + stats.user_count).toLocaleString()}{" "}
                    total)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {reviews.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">User Reviews ({reviews.length})</h3>
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{review.user_name}</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(review.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-lg">
                      {review.rating}/10
                    </span>
                  </div>
                </div>

                {review.comment && (
                  <p className="text-gray-700 whitespace-pre-wrap mt-3">
                    {review.comment}
                  </p>
                )}

                {review.updated_at !== review.created_at && (
                  <p className="text-xs text-gray-500 mt-2">
                    Edited on {formatDate(review.updated_at)}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-gray-600">
            No user reviews yet. Be the first to review this movie!
          </CardContent>
        </Card>
      )}
    </div>
  );
}
