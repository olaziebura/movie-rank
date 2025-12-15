"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateWishlistButton } from "@/components/CreateWishlistButton";
import { Film, Loader2, FolderOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Wishlist {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  movie_count?: number;
}

interface WishlistsListClientProps {
  userId: string;
}

export function WishlistsListClient({ userId }: WishlistsListClientProps) {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWishlists();
  }, []);

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

  // Refresh wishlists after creating a new one
  const handleWishlistCreated = () => {
    fetchWishlists();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (wishlists.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-2xl mx-auto text-center border-dashed border-2 border-gray-300">
          <CardHeader className="pb-4">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-pink-100 to-red-100 rounded-full flex items-center justify-center mb-4">
              <FolderOpen className="w-12 h-12 text-gray-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              No Wishlists Yet
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-8">
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">
              Create your first wishlist to start organizing your movies into custom collections!
            </p>
            <CreateWishlistButton onSuccess={handleWishlistCreated} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">
          {wishlists.length} {wishlists.length === 1 ? "wishlist" : "wishlists"}
        </p>
        <CreateWishlistButton onSuccess={handleWishlistCreated} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlists.map((wishlist) => (
          <Card
            key={wishlist.id}
            className="active:shadow-xl touch-manipulation transition-shadow cursor-pointer group lg:hover:shadow-lg"
          >
            <Link href={`/wishlists/${wishlist.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl transition-colors active:text-blue-600 lg:group-hover:text-blue-600">
                      {wishlist.name}
                    </CardTitle>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-100 to-red-100 rounded-full flex items-center justify-center transition-transform active:scale-110 lg:group-hover:scale-110">
                    <Film className="w-5 h-5 text-pink-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    Created {new Date(wishlist.created_at).toLocaleDateString()}
                  </span>
                  <span className="font-semibold text-blue-600">
                    {wishlist.movie_count || 0} {wishlist.movie_count === 1 ? "movie" : "movies"}
                  </span>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </>
  );
}
