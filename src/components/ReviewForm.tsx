"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Globe, Lock } from "lucide-react";
import type { Review } from "@/types/movie";

interface ReviewFormProps {
  movieId: number;
  existingReview?: Review | null;
  onSuccess: () => void;
}

export function ReviewForm({
  movieId,
  existingReview,
  onSuccess,
}: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [isPublic, setIsPublic] = useState(existingReview?.is_public ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const method = existingReview ? "PUT" : "POST";
      const url = existingReview
        ? `/api/reviews?id=${existingReview.id}`
        : "/api/reviews";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movie_id: movieId,
          rating,
          comment: comment.trim() || undefined,
          is_public: isPublic,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      // Always reset form after successful submission
      setRating(0);
      setComment("");
      setIsPublic(true);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (
      !existingReview ||
      !confirm("Are you sure you want to delete your review?")
    ) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/reviews?id=${existingReview.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete review");
      }

      onSuccess();
      setRating(0);
      setComment("");
      setIsPublic(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          {existingReview ? "Update Your Rating" : "Your Rating"}
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoveredRating(value)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform active:scale-125 touch-manipulation lg:hover:scale-110"
            >
              <Star
                className={`w-6 h-6 ${
                  value <= (hoveredRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
          <span className="ml-2 text-sm font-medium">
            {rating > 0 ? `${rating}/10` : "Select rating"}
          </span>
        </div>
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium mb-2">
          Review (Optional)
        </label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts about this movie..."
          rows={4}
          className="w-full"
        />
      </div>

      {/* Visibility Toggle */}
      <div>
        <label className="block text-sm font-medium mb-2">Visibility</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsPublic(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all touch-manipulation ${
              isPublic
                ? "bg-green-50 border-green-500 text-green-700"
                : "bg-gray-50 border-gray-200 text-gray-600 active:bg-gray-100 lg:hover:bg-gray-100"
            }`}
          >
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">Public</span>
          </button>
          <button
            type="button"
            onClick={() => setIsPublic(false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all touch-manipulation ${
              !isPublic
                ? "bg-amber-50 border-amber-500 text-amber-700"
                : "bg-gray-50 border-gray-200 text-gray-600 active:bg-gray-100 lg:hover:bg-gray-100"
            }`}
          >
            <Lock className="w-4 h-4" />
            <span className="text-sm font-medium">Private</span>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {isPublic
            ? "Everyone can see this review"
            : "Only you can see this review"}
        </p>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={rating === 0 || isSubmitting}
        >
          {isSubmitting
            ? "Submitting..."
            : existingReview
            ? "Update Review"
            : "Submit Review"}
        </Button>
        {existingReview && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            Delete
          </Button>
        )}
      </div>
    </form>
  );
}
