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
import { Loader2, Plus, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface Wishlist {
  id: string;
  name: string;
  movie_count?: number;
}

interface SelectWishlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movieId: number;
  onSuccess?: () => void;
}

export function SelectWishlistDialog({
  open,
  onOpenChange,
  movieId,
  onSuccess,
}: SelectWishlistDialogProps) {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedWishlistId, setSelectedWishlistId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchWishlists();
    }
  }, [open]);

  const fetchWishlists = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/wishlists");

      if (!response.ok) {
        throw new Error("Failed to fetch wishlists");
      }

      const data = await response.json();
      setWishlists(data.wishlists || []);
    } catch (error) {
      console.error("Error fetching wishlists:", error);
      toast.error("Failed to load wishlists");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToWishlist = async (wishlistId: string) => {
    setIsAdding(true);
    setSelectedWishlistId(wishlistId);

    try {
      const response = await fetch(`/api/wishlists/${wishlistId}/items`, {
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

      toast.success("Movie added to wishlist!");
      onOpenChange(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error adding movie to wishlist:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add movie to wishlist"
      );
    } finally {
      setIsAdding(false);
      setSelectedWishlistId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add to Wishlist</DialogTitle>
          <DialogDescription>
            Select a wishlist to add this movie to.
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
                You don't have any wishlists yet.
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
              {wishlists.map((wishlist) => (
                <Card
                  key={wishlist.id}
                  className="cursor-pointer active:bg-gray-100 touch-manipulation transition-colors lg:hover:bg-gray-50"
                  onClick={() => !isAdding && handleAddToWishlist(wishlist.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {wishlist.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {wishlist.movie_count || 0}{" "}
                          {wishlist.movie_count === 1 ? "movie" : "movies"}
                        </p>
                      </div>
                      {isAdding && selectedWishlistId === wishlist.id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      ) : (
                        <Check className="w-5 h-5 text-gray-300" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isAdding}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
