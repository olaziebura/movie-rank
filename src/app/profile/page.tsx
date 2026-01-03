import { auth0 } from "@/lib/auth/auth0";
import { getProfile } from "@/lib/supabase/profiles";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Settings, Heart, Calendar, Mail, User } from "lucide-react";
import { PrivateNotesSection } from "@/components/PrivateNotesSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile | MovieRank",
  description: "View and manage your MovieRank profile",
};

export default async function ProfilePage() {
  const session = await auth0.getSession();
  
  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">Please log in to view your profile.</p>
            <Button asChild>
              <Link href="/auth/login">Log In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userId = session.user.sub || session.user.id;
  
  let userProfile = null;
  let totalMoviesInWishlists = 0;
  let privateNotesCount = 0;
  
  if (userId) {
    try {
      userProfile = await getProfile(userId);
      
      // Fetch all wishlists for the user and count total movies
      const { data: wishlists } = await supabaseAdmin
        .from("wishlists")
        .select("movie_ids")
        .eq("user_id", userId);
      
      if (wishlists) {
        // Count all movies across all wishlists (including duplicates)
        wishlists.forEach((wishlist: { movie_ids: number[] | null }) => {
          const movieIds = wishlist.movie_ids || [];
          totalMoviesInWishlists += movieIds.length;
        });
      }

      // Count private reviews
      const { count } = await supabaseAdmin
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_public", false);
      
      privateNotesCount = count || 0;
    } catch (e) {
      console.error("Failed to fetch profile in ProfilePage:", e);
      // Continue with null profile - page should still load
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Profile Image */}
              <div className="flex-shrink-0">
                {userProfile?.profile_image_url ? (
                  <Image
                    width={120}
                    height={120}
                    src={userProfile.profile_image_url}
                    alt="Profile picture"
                    className="w-30 h-30 rounded-full object-cover border-4 border-gray-100"
                  />
                ) : (
                  <div className="w-30 h-30 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-100">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {userProfile?.name || session.user.name || "Anonymous User"}
                </h1>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-600 mb-4">
                  <Mail className="w-4 h-4" />
                  <span>{userProfile?.email || session.user.email}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-500 mb-6">
                  <Calendar className="w-4 h-4" />
                  <span>Member since {new Date().getFullYear()}</span>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild className="w-full sm:w-auto">
                    <Link href="/settings" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Edit Profile
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full sm:w-auto">
                    <Link href="/wishlists" className="flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      View Wishlists
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Wishlist Movies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {totalMoviesInWishlists}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {totalMoviesInWishlists === 1 ? 'movie saved' : 'movies saved'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Private Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                {privateNotesCount}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {privateNotesCount === 1 ? 'personal note' : 'personal notes'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">Active</div>
              <p className="text-sm text-gray-600 mt-1">
                All features available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Profile Complete
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {userProfile?.profile_image_url && userProfile?.name ? '100%' : '75%'}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {userProfile?.profile_image_url && userProfile?.name 
                  ? 'All info provided' 
                  : 'Add profile image'
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Private Notes Section */}
        <div className="mb-8">
          <PrivateNotesSection />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" asChild className="h-auto p-4">
                <Link href="/wishlists" className="flex flex-col items-center gap-2">
                  <Heart className="w-6 h-6" />
                  <span className="text-sm">Manage Wishlists</span>
                </Link>
              </Button>
              <Button variant="outline" asChild className="h-auto p-4">
                <Link href="/settings" className="flex flex-col items-center gap-2">
                  <Settings className="w-6 h-6" />
                  <span className="text-sm">Account Settings</span>
                </Link>
              </Button>
              <Button variant="outline" asChild className="h-auto p-4">
                <Link href="/" className="flex flex-col items-center gap-2">
                  <User className="w-6 h-6" />
                  <span className="text-sm">Browse Movies</span>
                </Link>
              </Button>
              <Button variant="outline" asChild className="h-auto p-4">
                <Link href="/auth/logout" className="flex flex-col items-center gap-2">
                  <Settings className="w-6 h-6" />
                  <span className="text-sm">Log Out</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
