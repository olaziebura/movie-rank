"use client";

import { cn } from "@/lib/utils";
import type { Movie } from "@/types/movie";
import type { SessionData } from "@auth0/nextjs-auth0/types";
import { Heart } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { SelectWishlistDialog } from "./SelectWishlistDialog";

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
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!userId) {
        setIsInWishlist(false);
        return;
      }

      try {
        setLoading(true);
        // Check if movie is in any wishlist
        const response = await fetch("/api/wishlists");
        if (!response.ok) {
          setIsInWishlist(false);
          return;
        }

        const data = await response.json();
        const wishlists = data.wishlists || [];
        
        // Check if movie_ids array contains this movie in any wishlist
        const foundInWishlist = wishlists.some((wishlist: any) => 
          wishlist.movie_ids?.includes(movieId)
        );
        
        setIsInWishlist(foundInWishlist);
      } catch (error) {
        console.error("Failed to check wishlist status:", error);
        setIsInWishlist(false);
      } finally {
        setLoading(false);
      }
    };

    checkWishlistStatus();
  }, [userId, movieId]);

  const handleWishlistToggle = useCallback(async () => {
    if (!userId || loading) {
      return;
    }

    // Always open dialog - user can add/remove from multiple wishlists
    setDialogOpen(true);
  }, [userId, loading]);

  const handleDialogSuccess = () => {
    setIsInWishlist(true);
  };

  const handleDialogRemoved = () => {
    setIsInWishlist(false);
  };

  if (!userId) {
    return null;
  }

  return (
    <>
      <Heart
        className={cn(
          "w-8 h-8 cursor-pointer transition-all duration-200 active:scale-125 touch-manipulation lg:hover:scale-110",
          {
            "text-red-500": isInWishlist,
            "text-gray-300 active:text-red-300 lg:hover:text-red-300": !isInWishlist,
            "opacity-50 cursor-not-allowed scale-100": loading,
          }
        )}
        onClick={handleWishlistToggle}
        fill={isInWishlist ? "currentColor" : "none"}
        aria-label={isInWishlist ? "Manage wishlists" : "Add to wishlist"}
      />
      <SelectWishlistDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        movieId={movieId}
        onSuccess={handleDialogSuccess}
        onRemoved={handleDialogRemoved}
      />
    </>
  );
};
