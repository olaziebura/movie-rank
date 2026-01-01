"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Plus, Check, Square, CheckSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface Wishlist {
  id: string;
  name: string;
  movie_count?: number;
  movie_ids?: number[];
}

interface SelectWishlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movieId: number;
  onSuccess?: () => void;
  onRemoved?: () => void;
}

export function SelectWishlistDialog({
  open,
  onOpenChange,
  movieId,
  onSuccess,
  onRemoved,
}: SelectWishlistDialogProps) {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingWishlistId, setProcessingWishlistId] = useState<string | null>(null);
  const [initialWishlistIds, setInitialWishlistIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      fetchWishlists();
    }
  }, [open, movieId]);

  const fetchWishlists = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/wishlists");

      if (!response.ok) {
        throw new Error("Failed to fetch wishlists");
      }

      const data = await response.json();
      const fetchedWishlists = data.wishlists || [];
      setWishlists(fetchedWishlists);
      
      // Track which wishlists originally contained the movie
      const initialIds = new Set<string>();
      fetchedWishlists.forEach((wishlist: Wishlist) => {
        if (wishlist.movie_ids?.includes(movieId)) {
          initialIds.add(wishlist.id);
        }
      });
      setInitialWishlistIds(initialIds);
    } catch (error) {
      console.error("Error fetching wishlists:", error);
      toast.error("Failed to load wishlists");
    } finally {
      setIsLoading(false);
    }
  };

  const isMovieInWishlist = (wishlist: Wishlist): boolean => {
    return wishlist.movie_ids?.includes(movieId) || false;
  };

  const handleToggleWishlist = async (wishlist: Wishlist) => {
    const isInWishlist = isMovieInWishlist(wishlist);
    setProcessingWishlistId(wishlist.id);

    try {
      if (isInWishlist) {
        // Remove from wishlist
        const response = await fetch(`/api/wishlists/${wishlist.id}/items`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ movieId }),
        });

        if (!response.ok) {
          throw new Error("Failed to remove movie from wishlist");
        }

        // Update local state
        setWishlists(prev => prev.map(w => 
          w.id === wishlist.id 
            ? { 
                ...w, 
                movie_ids: (w.movie_ids || []).filter(id => id !== movieId),
                movie_count: Math.max((w.movie_count || 1) - 1, 0)
              }
            : w
        ));

        toast.success(`Removed from "${wishlist.name}"`);
      } else {
        // Add to wishlist
        const response = await fetch(`/api/wishlists/${wishlist.id}/items`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ movie_id: movieId }),
        });

        if (!response.ok) {
          const error = await response.json();
          if (response.status === 409) {
            toast.error("Movie already in this wishlist");
          } else {
            throw new Error(error.message || "Failed to add movie to wishlist");
          }
          return;
        }

        // Update local state
        setWishlists(prev => prev.map(w => 
          w.id === wishlist.id 
            ? { 
                ...w, 
                movie_ids: [...(w.movie_ids || []), movieId],
                movie_count: (w.movie_count || 0) + 1
              }
            : w
        ));

        toast.success(`Added to "${wishlist.name}"`);
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update wishlist"
      );
    } finally {
      setProcessingWishlistId(null);
    }
  };

  const handleClose = () => {
    // Check if any changes were made
    const currentWishlistIds = new Set(
      wishlists.filter(w => isMovieInWishlist(w)).map(w => w.id)
    );
    
    const wasAdded = [...currentWishlistIds].some(id => !initialWishlistIds.has(id));
    const wasRemoved = [...initialWishlistIds].some(id => !currentWishlistIds.has(id));
    const isNowInAnyWishlist = currentWishlistIds.size > 0;

    if (wasAdded && onSuccess) {
      onSuccess();
    }
    
    if (wasRemoved && !isNowInAnyWishlist && onRemoved) {
      onRemoved();
    } else if (wasRemoved && isNowInAnyWishlist && onSuccess) {
      onSuccess();
    }

    onOpenChange(false);
  };

  const getWishlistsWithMovie = (): number => {
    return wishlists.filter(w => isMovieInWishlist(w)).length;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Wishlists</DialogTitle>
          <DialogDescription>
            {getWishlistsWithMovie() > 0 ? (
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                This movie is saved in {getWishlistsWithMovie()} wishlist{getWishlistsWithMovie() !== 1 ? 's' : ''}
              </span>
            ) : (
              "Select wishlists to save this movie"
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : wishlists.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                You don&apos;t have any wishlists yet.
              </p>
              <Button asChild variant="outline">
                <Link href="/wishlists">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Wishlist
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {wishlists.map((wishlist) => {
                const isInWishlist = isMovieInWishlist(wishlist);
                const isProcessing = processingWishlistId === wishlist.id;
                
                return (
                  <Card
                    key={wishlist.id}
                    className={`cursor-pointer transition-all duration-200 touch-manipulation ${
                      isInWishlist 
                        ? 'bg-green-50 border-green-200 lg:hover:bg-green-100' 
                        : 'lg:hover:bg-gray-50 active:bg-gray-100'
                    } ${isProcessing ? 'opacity-70' : ''}`}
                    onClick={() => !isProcessing && handleToggleWishlist(wishlist)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isProcessing ? (
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600 flex-shrink-0" />
                          ) : isInWishlist ? (
                            <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                          <div>
                            <h3 className={`font-semibold ${isInWishlist ? 'text-green-800' : 'text-gray-900'}`}>
                              {wishlist.name}
                            </h3>
                            <p className={`text-sm ${isInWishlist ? 'text-green-600' : 'text-gray-500'}`}>
                              {wishlist.movie_count || 0}{" "}
                              {wishlist.movie_count === 1 ? "movie" : "movies"}
                              {isInWishlist && (
                                <span className="ml-2 text-green-600 font-medium">
                                  • Saved here
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/wishlists">
              <Plus className="w-4 h-4 mr-2" />
              New Wishlist
            </Link>
          </Button>
          <Button
            type="button"
            onClick={handleClose}
            disabled={processingWishlistId !== null}
            className="w-full sm:w-auto"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
