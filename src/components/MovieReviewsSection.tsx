"use client";

import { useState, useEffect } from "react";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewsList } from "@/components/ReviewsList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Review } from "@/types/movie";

interface MovieReviewsSectionProps {
  movieId: number;
  userId: string | null;
}

export function MovieReviewsSection({
  movieId,
  userId,
}: MovieReviewsSectionProps) {
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [isLoadingUserReview, setIsLoadingUserReview] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const fetchUserReview = async () => {
      setIsLoadingUserReview(true);
      try {
        const response = await fetch(
          `/api/reviews?movieId=${movieId}&userId=${userId}`
        );
        if (response.ok) {
          const data = await response.json();
          setUserReview(data.review);
        }
      } catch (error) {
        console.error("Error fetching user review:", error);
      } finally {
        setIsLoadingUserReview(false);
      }
    };

    fetchUserReview();
  }, [movieId, userId, refreshTrigger]);

  const handleReviewSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {userId && (
        <Card>
          <CardHeader>
            <CardTitle>
              {userReview ? "Your Review" : "Write a Review"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingUserReview ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <ReviewForm
                movieId={movieId}
                existingReview={userReview}
                onSuccess={handleReviewSuccess}
              />
            )}
          </CardContent>
        </Card>
      )}

      <ReviewsList movieId={movieId} refreshTrigger={refreshTrigger} />
    </div>
  );
}
