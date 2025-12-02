"use client";

import { PopularMovies } from "@/components/homepage/PopularMovies";
import type { Movie } from "@/types/movie";
import type { UserProfile } from "@/types/user";

type HeroWithResultsProps = {
  session: unknown;
  profile: UserProfile | null;
  popularMovies?: Movie[] | null;
};

export function HeroWithResults({
  session,
  profile,
  popularMovies,
}: HeroWithResultsProps) {
  return (
    <div className="w-full">
      <div className="max-w-[2000px] mx-auto">
        {/* Popular Movies with integrated filtering */}
        {popularMovies && (
          <PopularMovies
            movies={popularMovies}
            session={session as never}
            profile={profile}
          />
        )}
      </div>
    </div>
  );
}
