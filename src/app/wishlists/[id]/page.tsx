import { auth0 } from "@/lib/auth/auth0";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Film, Plus } from "lucide-react";
import type { Metadata } from "next";
import { WishlistMoviesClient } from "@/components/WishlistMoviesClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  
  return {
    title: "Wishlist | MovieRank",
    description: "View and manage movies in your wishlist",
  };
}

export default async function WishlistDetailPage({ params }: PageProps) {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/api/auth/login");
  }

  const { id } = await params;
  const userId = session.user.sub ?? session.user.id;

  // Fetch wishlist details directly using supabaseAdmin
  const { supabaseAdmin } = await import("@/lib/supabase/supabaseAdmin");
  
  const { data: wishlist, error } = await supabaseAdmin
    .from("wishlists")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !wishlist) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/wishlists" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Wishlists
            </Link>
          </Button>
        </div>

        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center">
              <Film className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{wishlist.name}</h1>
              <p className="text-gray-600">
                Created {new Date(wishlist.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <Button asChild>
            <Link href="/search" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Movies
            </Link>
          </Button>
        </div>

        {/* Movies List */}
        <WishlistMoviesClient wishlistId={id} userId={userId} />
      </div>
    </div>
  );
}
