"use client";
import type { Movie } from "@/types/movie";
import { Star, Vote, Heart } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import {
  addMovieToWishlist,
  removeMovieFromWishlist,
} from "@/lib/supabase/wishlist";
import type { SessionData } from "@auth0/nextjs-auth0/types";
import type { UserProfile } from "@/types/user";
import { cn } from "@/lib/utils";

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
  const [isInWishlist, setIsInWishlist] = useState(
    !!profile?.wishlist.find((id) => Number(id) === movie.id)
  );

  const { user } = session || {};
  const {
    id,
    title,
    vote_average,
    poster_path,
    release_date,
    vote_count,
    overview,
  } = movie;

  const handleWishlistToggle = async () => {
    const userId = user?.sub || user?.id;
    if (!userId) return;

    if (isInWishlist) {
      await removeMovieFromWishlist(userId, id);
    } else {
      await addMovieToWishlist(userId, id);
    }
    setIsInWishlist(!isInWishlist);
  };

  const isReleased = new Date(release_date) <= new Date();
  if (!isReleased) return null;

  const starsCount = Math.round(vote_average);

  return (
    <div
      className="relative bg-neutral-600 text-white rounded shadow-2xl group transform transition-transform hover:scale-101"
      key={id}
    >
      <div className="relative overflow-hidden">
        {typeof position === "number" && !!position && (
          <div className="absolute w-full h-full bg-neutral-900/40 overflow-hidden transition-opacity group-hover:opacity-0">
            <span className="absolute -left-10 top-30 -tracking-[60px] text-[300px] transform opacity-30">
              {position}
            </span>
          </div>
        )}

        <Image
          width={200}
          height={300}
          src={`https://image.tmdb.org/t/p/w500${poster_path}`}
          alt={title}
          className="w-full h-auto rounded mb-2"
        />

        <div className="absolute bottom-0 left-0 right-0 px-4 py-4 bg-neutral-700/80 group-hover:opacity-0 transition-opacity duration-300">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="flex items-center gap-1 text-yellow-500">
            {Array.from({ length: 10 }).map((_, i) => (
              <Star
                key={i}
                fill={i < starsCount ? "currentColor" : "none"}
                stroke="currentColor"
                className="w-4 h-4"
              />
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-neutral-700/80 px-4 py-2 translate-y-full group-hover:translate-y-0 transition-all duration-300">
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-gray-400 flex gap-1 items-center">
              <Vote />
              <span>{vote_count}</span>
            </p>
            <p className="text-sm text-gray-400">{release_date}</p>
          </div>
          <p className="text-sm text-gray-200 mt-2">{overview}</p>
          <a
            href={`/movie/${id}`}
            className="inline-block mt-2 text-blue-300 hover:text-blue-400"
          >
            Show more
          </a>
        </div>
        {session && (
          <div className="absolute top-2 right-2">
            <Heart
              className={cn("w-8 h-8 cursor-pointer text-gray-300", {
                "text-red-500": isInWishlist,
              })}
              onClick={handleWishlistToggle}
              fill={isInWishlist ? "currentColor" : "none"}
            />
          </div>
        )}
      </div>
    </div>
  );
};
