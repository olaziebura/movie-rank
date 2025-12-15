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
        // Check if movie is in any wishlist
        const response = await fetch("/api/wishlists");
        if (!response.ok) {
          setIsInWishlist(false);
          return;
        }

        const data = await response.json();
        const wishlists = data.wishlists || [];
        
        // Check each wishlist for this movie
        let foundInWishlist = false;
        for (const wishlist of wishlists) {
          const itemsResponse = await fetch(`/api/wishlists/${wishlist.id}/items`);
          if (itemsResponse.ok) {
            const itemsData = await itemsResponse.json();
            const movies = itemsData.movies || [];
            if (movies.some((m: any) => m.id === movieId)) {
              foundInWishlist = true;
              break;
            }
          }
        }
        
        setIsInWishlist(foundInWishlist);
      } catch (error) {
        console.error("Failed to check wishlist status:", error);
        setIsInWishlist(false);
      }
    };

    checkWishlistStatus();
  }, [userId, movieId]);

  const handleWishlistToggle = useCallback(async () => {
    if (!userId || loading) {
      return;
    }

    // If movie is not in any wishlist, open dialog to select wishlist
    if (!isInWishlist) {
      setDialogOpen(true);
      return;
    }

    // If already in wishlist, we need to remove it
    // For now, we'll just prevent removal - user should go to wishlist page to remove
    // TODO: Add option to remove from specific wishlist
    setDialogOpen(true);
  }, [userId, loading, isInWishlist]);

  const handleDialogSuccess = () => {
    setIsInWishlist(true);
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
        aria-label={isInWishlist ? "In wishlist" : "Add to wishlist"}
      />
      <SelectWishlistDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        movieId={movieId}
        onSuccess={handleDialogSuccess}
      />
    </>
  );
};
