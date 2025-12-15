"use client";

import { useState, useEffect } from "react";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewsList } from "@/components/ReviewsList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MovieReviewsSectionProps {
  movieId: number;
  userId: string | null;
}

export function MovieReviewsSection({
  movieId,
  userId,
}: MovieReviewsSectionProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [formKey, setFormKey] = useState(0);

  const handleReviewSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    // Reset form by changing its key - forces React to remount the component
    setFormKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {userId && (
        <Card>
          <CardHeader>
            <CardTitle>Write a Review</CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewForm
              key={formKey}
              movieId={movieId}
              onSuccess={handleReviewSuccess}
            />
          </CardContent>
        </Card>
      )}

      <ReviewsList 
        movieId={movieId} 
        refreshTrigger={refreshTrigger} 
        currentUserId={userId}
      />
    </div>
  );
}
