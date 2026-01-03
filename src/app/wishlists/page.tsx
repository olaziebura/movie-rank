import { auth0 } from "@/lib/auth/auth0";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, List } from "lucide-react";
import type { Metadata } from "next";
import { WishlistsListClient } from "@/components/WishlistsListClient";

export const metadata: Metadata = {
  title: "My Wishlists | MovieRank",
  description: "Your personal movie wishlists - organize movies you want to watch",
};

// Login required component
function LoginRequired() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Access Your Wishlists</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-6">
            Please log in to view and manage your personal movie wishlists.
          </p>
          <Button asChild className="w-full">
            <Link href="/auth/login">Log In</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function WishlistsPage() {
  const session = await auth0.getSession();

  if (!session) {
    return <LoginRequired />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center">
              <List className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Wishlists</h1>
              <p className="text-gray-600">
                Organize your movies into custom collections
              </p>
            </div>
          </div>
        </div>

        {/* Client component that handles fetching and displaying wishlists */}
        <WishlistsListClient />
      </div>
    </div>
  );
}
