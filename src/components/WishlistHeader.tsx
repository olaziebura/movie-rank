"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Heart, Search } from "lucide-react";
import { CreateWishlistButton } from "@/components/CreateWishlistButton";

interface WishlistHeaderProps {
  totalMovies: number;
}

export function WishlistHeader({ totalMovies }: WishlistHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center">
          <Heart className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-gray-600">
            {totalMovies} {totalMovies === 1 ? "movie" : "movies"} saved
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <CreateWishlistButton />
        <Button asChild variant="outline">
          <Link href="/" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Add More Movies
          </Link>
        </Button>
      </div>
    </div>
  );
}
