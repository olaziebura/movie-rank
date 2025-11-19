"use client";

import type { Movie } from "@/types/movie";
import { Star, Vote } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";

import type { SessionData } from "@auth0/nextjs-auth0/types";
import type { UserProfile } from "@/types/user";
import { WishlistButton } from "./WishlistButton";

type MovieItemProps = {
  movie: Movie;
  position?: number;
  session?: SessionData | null;
  profile?: UserProfile | null;
  variant?: "single" | "list";
};

export const MovieItem = ({
  movie,
  position,
  session,
  profile,
}: MovieItemProps) => {
  const router = useRouter();
  const {
    id,
    title,
    vote_average,
    poster_path,
    release_date,
    vote_count,
    overview,
  } = movie;

  // Check if movie is released (only show released movies)
  const isReleased = useMemo(() => {
    if (!release_date) return false;
    return new Date(release_date) <= new Date();
  }, [release_date]);

  // Calculate star rating (0-10 scale to 0-10 stars)
  const starsCount = useMemo(() => {
    return Math.round(Math.max(0, Math.min(10, vote_average)));
  }, [vote_average]);

  // Check if user has this movie in wishlist
  const isInWishlist = useMemo(() => {
    if (!profile?.wishlist) return false;
    return profile.wishlist.includes(id);
  }, [profile?.wishlist, id]);

  const handleNavigate = useCallback(() => {
    router.push(`/movie/${id}`);
  }, [router, id]);

  const handleWishlistClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // Don't render unreleased movies
  if (!isReleased) {
    return null;
  }

  // Generate poster URL with fallback
  const posterUrl = poster_path
    ? `https://image.tmdb.org/t/p/w500${poster_path}`
    : "/placeholder-movie.svg";

  return (
    <div
      className="relative bg-neutral-600 text-white rounded-lg shadow-2xl group transform transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden"
      onClick={handleNavigate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleNavigate();
        }
      }}
      aria-label={`View details for ${title}`}
    >
      <div className="relative overflow-hidden">
        {/* Position overlay for ranked lists */}
        {typeof position === "number" && position > 0 && (
          <div className="absolute w-full h-full bg-neutral-900/40 overflow-hidden transition-opacity group-hover:opacity-0 z-10">
            <span className="absolute -left-10 top-30 -tracking-[60px] text-[300px] font-bold transform opacity-30 select-none">
              {position}
            </span>
          </div>
        )}

        <Image
          width={500}
          height={750}
          src={posterUrl}
          alt={`${title} poster`}
          className="w-full h-auto rounded-t-lg"
          priority={position ? position <= 6 : false}
        />

        {/* Default overlay with title and rating */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-4 bg-gradient-to-t from-neutral-900/90 to-transparent group-hover:opacity-0 transition-opacity duration-300">
          <h3 className="text-lg font-semibold mb-2 line-clamp-2">{title}</h3>
          <div className="flex items-center gap-1 text-yellow-500">
            {Array.from({ length: 10 }).map((_, i) => (
              <Star
                key={i}
                fill={i < starsCount ? "currentColor" : "none"}
                stroke="currentColor"
                className="w-4 h-4"
                aria-hidden="true"
              />
            ))}
            <span className="ml-2 text-sm text-gray-300">
              ({vote_average.toFixed(1)})
            </span>
          </div>
        </div>

        {/* Hover overlay with additional details */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-neutral-900/95 to-neutral-800/80 px-4 py-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-300 flex gap-1 items-center">
              <Vote className="w-4 h-4" aria-hidden="true" />
              <span>{vote_count.toString()} votes</span>
            </p>
            <p className="text-sm text-gray-300">
              {(() => {
                try {
                  const y = new Date(release_date).getFullYear();
                  return Number.isFinite(y) ? y : "";
                } catch {
                  return "";
                }
              })()}
            </p>
          </div>
          {overview && (
            <p className="text-sm text-gray-200 line-clamp-3">{overview}</p>
          )}
        </div>

        {/* Wishlist button */}
        {session?.user && profile && (
          <div
            className="absolute top-3 right-3 z-20"
            onClick={handleWishlistClick}
          >
            <WishlistButton
              userId={session.user.sub || session.user.id}
              movieId={id}
              initialIsInWishlist={isInWishlist}
            />
          </div>
        )}
      </div>
    </div>
  );
};
