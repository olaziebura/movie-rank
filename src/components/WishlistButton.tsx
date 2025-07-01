"use client";

import {
  removeMovieFromWishlist,
  addMovieToWishlist,
} from "@/lib/supabase/wishlist";
import { cn } from "@/lib/utils";
import type { Movie } from "@/types/movie";
import type { SessionData } from "@auth0/nextjs-auth0/types";
import { Heart } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { getProfile } from "@/lib/supabase/profiles";

type WishlistButtonProps = {
  movieId: Movie["id"];
  userId: SessionData["user"]["org_id"] | null;
  initialIsInWishlist?: boolean;
};

export const WishlistButton = ({
  movieId,
  userId,
  initialIsInWishlist = false,
}: WishlistButtonProps) => {
  const [isInWishlist, setIsInWishlist] = useState(initialIsInWishlist);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!userId) {
        setIsInWishlist(false);
        return;
      }

      try {
        // Use fetch to call the wishlist API instead of direct DB calls
        const response = await fetch(
          `/api/wishlist?userId=${encodeURIComponent(userId)}`
        );
        if (response.ok) {
          const data = await response.json();
          // Normalize the movie ID to number for comparison
          const movieIdNum = typeof movieId === 'string' ? parseInt(movieId, 10) : movieId;
          const normalizedWishlist = (data.wishlist || []).map((id: number | string) => 
            typeof id === 'string' ? parseInt(id, 10) : id
          );
          const isInList = normalizedWishlist.includes(movieIdNum);
          setIsInWishlist(isInList);
        } else {
          // Fallback to getProfile if API fails
          const profile = await getProfile(userId);
          if (profile?.wishlist) {
            // Normalize the movie ID to number for comparison
            const movieIdNum = typeof movieId === 'string' ? parseInt(movieId, 10) : movieId;
            const normalizedWishlist = profile.wishlist.map((id: number | string) => 
              typeof id === 'string' ? parseInt(id, 10) : id
            );
            const isInList = normalizedWishlist.includes(movieIdNum);
            setIsInWishlist(isInList);
          } else {
            setIsInWishlist(false);
          }
        }
      } catch (error) {
        console.error("Failed to check wishlist status:", error);
        // If there's an error, keep the initial state
        setIsInWishlist(initialIsInWishlist);
      }
    };

    // Always check wishlist status when component mounts or user/movie changes
    checkWishlistStatus();
  }, [userId, movieId, initialIsInWishlist]);

  const handleWishlistToggle = useCallback(async () => {
    if (!userId || loading) {
      return;
    }

    setLoading(true);

    try {
      if (isInWishlist) {
        await removeMovieFromWishlist(userId, movieId);
      } else {
        await addMovieToWishlist(userId, movieId);
      }

      setIsInWishlist(!isInWishlist);
    } catch (error) {
      console.error("Failed to toggle wishlist:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, loading, movieId, isInWishlist]);

  if (!userId) {
    return null;
  }

  return (
    <Heart
      className={cn(
        "w-8 h-8 cursor-pointer transition-all duration-200 hover:scale-110",
        {
          "text-red-500": isInWishlist,
          "text-gray-300 hover:text-red-300": !isInWishlist,
          "opacity-50 cursor-not-allowed scale-100": loading,
        }
      )}
      onClick={handleWishlistToggle}
      fill={isInWishlist ? "currentColor" : "none"}
      aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
    />
  );
};
