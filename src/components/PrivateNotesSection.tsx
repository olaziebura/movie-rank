"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Star, Calendar, BookOpen, ExternalLink, Trash2 } from "lucide-react";
import type { Review } from "@/types/movie";

type PrivateReviewWithMovie = Review & {
  movie?: {
    id: number;
    title: string;
    poster_path: string | null;
    release_date: string;
  } | null;
};

export function PrivateNotesSection() {
  const [notes, setNotes] = useState<PrivateReviewWithMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrivateNotes();
  }, []);

  const fetchPrivateNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/reviews?private=true");
      const data = await response.json();

      if (response.ok) {
        setNotes(data.reviews || []);
      } else {
        setError(data.error || "Failed to load private notes");
      }
    } catch (err) {
      setError("Failed to load private notes");
      console.error("Error fetching private notes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this private note?")) {
      return;
    }

    try {
      const response = await fetch(`/api/reviews?id=${reviewId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotes(notes.filter((n) => n.id !== reviewId));
      } else {
        alert("Failed to delete note");
      }
    } catch (err) {
      console.error("Error deleting note:", err);
      alert("Failed to delete note");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Private Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Private Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-600" />
          Private Notes
          <span className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            <Lock className="w-3 h-3" />
            Only visible to you
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No private notes yet</p>
            <p className="text-sm text-gray-400 mb-4">
              Create a private review on any movie to keep personal notes
            </p>
            <Button variant="outline" asChild>
              <Link href="/search">Discover Movies</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-4">
              Your personal movie notebook with {notes.length} private {notes.length === 1 ? 'note' : 'notes'}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="group relative bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg overflow-hidden transition-all active:scale-[0.99] lg:hover:shadow-md"
                >
                  <div className="flex gap-4 p-4">
                    {/* Movie Poster */}
                    <Link href={`/movie/${note.movie_id}`} className="flex-shrink-0">
                      <div className="relative w-20 h-28 rounded-md overflow-hidden bg-gray-200 shadow-sm">
                        {note.movie?.poster_path ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w200${note.movie.poster_path}`}
                            alt={note.movie?.title || "Movie poster"}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <BookOpen className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Note Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Link 
                          href={`/movie/${note.movie_id}`}
                          className="font-semibold text-gray-900 line-clamp-1 active:text-amber-700 lg:hover:text-amber-700 transition-colors"
                        >
                          {note.movie?.title || `Movie #${note.movie_id}`}
                        </Link>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="font-bold text-sm">{note.rating}/10</span>
                        </div>
                      </div>

                      {note.movie?.release_date && (
                        <p className="text-xs text-gray-500 mb-2">
                          {new Date(note.movie.release_date).getFullYear()}
                        </p>
                      )}

                      {note.comment ? (
                        <p className="text-sm text-gray-700 line-clamp-3 mb-2">
                          {note.comment}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic mb-2">
                          No notes written
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(note.created_at)}</span>
                          {note.updated_at !== note.created_at && (
                            <span className="text-gray-400">(edited)</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <Link
                            href={`/movie/${note.movie_id}`}
                            className="p-1 text-gray-400 active:text-amber-600 lg:hover:text-amber-600 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 text-gray-400 active:text-red-500 lg:hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Private Badge */}
                  <div className="absolute top-2 right-2">
                    <Lock className="w-3 h-3 text-amber-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
