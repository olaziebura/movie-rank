"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Star, Calendar, Trash2, Globe, Lock, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Review = {
  id: string;
  movie_id: number;
  rating: number;
  comment: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  movie?: {
    id: number;
    title: string;
    poster_path: string | null;
    release_date: string;
  } | null;
};

export function UserActivitySection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserReviews();
  }, []);

  const fetchUserReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/reviews");
      const data = await response.json();

      if (response.ok) {
        setReviews(data.reviews || []);
      } else {
        setError(data.error || "Failed to load reviews");
      }
    } catch (err) {
      setError("Failed to load reviews");
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      const response = await fetch(`/api/reviews?id=${reviewId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setReviews(reviews.filter((r) => r.id !== reviewId));
      } else {
        alert("Failed to delete review");
      }
    } catch (err) {
      console.error("Error deleting review:", err);
      alert("Failed to delete review");
    }
  };

  if (loading) {
    return (
      <Card className="bg-neutral-800 border-neutral-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <History className="w-5 h-5" />
            Your Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-neutral-800 border-neutral-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <History className="w-5 h-5" />
            Your Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-400">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-neutral-800 border-neutral-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <History className="w-5 h-5" />
          Your Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-neutral-400 mb-4">You haven't reviewed any movies yet.</p>
            <Link href="/search">
              <Button variant="outline" className="border-neutral-600 text-neutral-300 hover:bg-neutral-700">
                Discover Movies
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-neutral-300">
                You've reviewed <span className="font-bold text-yellow-500">{reviews.length}</span> movie{reviews.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-neutral-700 p-4 rounded-lg border border-neutral-600 hover:border-neutral-500 transition-colors"
                >
                  <div className="flex gap-4">
                    {/* Movie Poster */}
                    <Link href={`/movie/${review.movie_id}`} className="flex-shrink-0">
                      <div className="relative w-16 h-24 rounded overflow-hidden bg-neutral-600">
                        {review.movie?.poster_path ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w200${review.movie.poster_path}`}
                            alt={review.movie?.title || "Movie poster"}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film className="w-6 h-6 text-neutral-500" />
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Review Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <Link 
                          href={`/movie/${review.movie_id}`}
                          className="font-semibold text-white line-clamp-1 hover:text-yellow-400 transition-colors"
                        >
                          {review.movie?.title || `Movie #${review.movie_id}`}
                        </Link>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-bold text-white">{review.rating}/10</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        {review.movie?.release_date && (
                          <span className="text-xs text-neutral-400">
                            {new Date(review.movie.release_date).getFullYear()}
                          </span>
                        )}
                        <span className="text-neutral-500">•</span>
                        {review.is_public ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-400">
                            <Globe className="w-3 h-3" />
                            Public
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                            <Lock className="w-3 h-3" />
                            Private
                          </span>
                        )}
                      </div>
                      
                      {review.comment && (
                        <p className="text-neutral-300 text-sm line-clamp-2 mb-2">
                          {review.comment}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(review.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          {review.updated_at !== review.created_at && (
                            <span className="text-neutral-600">(edited)</span>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReview(review.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-7 px-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
