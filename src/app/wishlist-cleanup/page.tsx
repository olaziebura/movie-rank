"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function WishlistCleanupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    wishlist: number[];
    count: number;
  } | null>(null);
  const [error, setError] = useState<string>("");

  const handleCleanup = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/wishlist/cleanup", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || "Failed to cleanup wishlist");
      }
    } catch (err) {
      setError("Network error occurred");
      console.error("Cleanup error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      const response = await fetch("/api/wishlist?userId=test"); // This will use the current user's session
      const data = await response.json();
      console.log("Current wishlist:", data);
    } catch (err) {
      console.error("Failed to fetch wishlist:", err);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Wishlist Cleanup Tool
        </h1>
        
        <div className="max-w-2xl mx-auto">
          <div className="bg-neutral-800 p-6 rounded-lg mb-6">
            <h2 className="text-2xl font-semibold mb-4">Problem:</h2>
            <p className="text-gray-300 mb-4">
              Your wishlist contains duplicate movie IDs because of a data type mismatch:
            </p>
            <pre className="bg-neutral-700 p-3 rounded text-sm">
              {`["552524","552524","552524","552524","1090007"]`}
            </pre>
            <p className="text-gray-300 mt-4">
              The issue was that movie IDs were stored as strings but compared as numbers,
              causing the duplicate check to fail.
            </p>
          </div>

          <div className="bg-neutral-800 p-6 rounded-lg mb-6">
            <h2 className="text-2xl font-semibold mb-4">Solution:</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Fixed the wishlist functions to handle both string and number IDs</li>
              <li>Added normalization to convert all IDs to numbers</li>
              <li>Added duplicate removal using Set</li>
              <li>Updated the WishlistButton to handle type mismatches</li>
            </ul>
          </div>

          <div className="bg-neutral-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Clean Up Your Wishlist:</h2>
            <p className="text-gray-300 mb-4">
              Click the button below to remove duplicates from your current wishlist:
            </p>
            
            <div className="flex gap-4 mb-4">
              <Button 
                onClick={handleCleanup}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? "Cleaning up..." : "Clean Up Duplicates"}
              </Button>
              
              <Button 
                onClick={fetchWishlist}
                variant="outline"
                className="border-gray-600 text-gray-300"
              >
                Check Wishlist (Console)
              </Button>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-500 p-4 rounded mb-4">
                <p className="text-red-200">Error: {error}</p>
              </div>
            )}

            {result && (
              <div className="bg-green-900/50 border border-green-500 p-4 rounded">
                <h3 className="text-green-200 font-semibold mb-2">Success!</h3>
                <p className="text-green-200">
                  {result.message}
                </p>
                <p className="text-green-200 mt-2">
                  Cleaned wishlist has {result.count} unique movies.
                </p>
                <pre className="bg-neutral-700 p-3 rounded text-sm mt-3 text-gray-300">
                  {JSON.stringify(result.wishlist, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
