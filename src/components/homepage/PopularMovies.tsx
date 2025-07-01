"use client";

import { useRef } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import type { Movie } from "@/types/movie";
import { MovieItem } from "../MovieItem";
import { Button } from "../ui/button";
import type { SessionData } from "@auth0/nextjs-auth0/types";
import type { UserProfile } from "@/types/user";

type PopularMoviesProps = {
  movies: Movie[] | null;
  session: SessionData | null;
  profile: UserProfile | null;
};

export const PopularMovies = ({
  movies,
  session,
  profile,
}: PopularMoviesProps) => {

  if (!movies) {
    return (
      <div className="mx-auto pb-10 p-4 text-white overflow-hidden bg-neutral-600">
        <h2 className="text-2xl font-bold">No movies available</h2>
        <p className="text-lg">Please check back later.</p>
      </div>
    );
  }

  const releasedMovies = movies?.filter(
    (m) => new Date(m.release_date) <= new Date()
  );

  const top10Movies: Movie[] = releasedMovies.slice(0, 10);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const sliderRef = useRef<Slider | null>(null);

  const next = () => sliderRef.current?.slickNext();
  const previous = () => sliderRef.current?.slickPrev();

  const responsiveSettings = [
    {
      breakpoint: 1024,
      settings: { slidesToShow: 4, slidesToScroll: 2 },
    },
    {
      breakpoint: 800,
      settings: { slidesToShow: 2, slidesToScroll: 2, initialSlide: 2 },
    },
    {
      breakpoint: 600,
      settings: { slidesToShow: 1, slidesToScroll: 1 },
    },
  ];

  const sliderSettings = {
    dots: false,
    infinite: true,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    arrows: false,
    speed: 500,
    slidesToShow: 5,
    responsive: responsiveSettings,
    nextArrow: <></>,
    prevArrow: <></>,
  };

  return (
    <div className="mx-auto pb-10 p-4 text-white overflow-hidden bg-neutral-600">
      <h2 className="text-3xl font-bold mb-4">Top 10 Popular Movies</h2>
      <Slider ref={sliderRef} {...sliderSettings}>
        {top10Movies.map((movie, index) => (
          <div key={movie.id} className="px-2">
            <MovieItem
              profile={profile}
              session={session}
              movie={movie}
              position={index + 1}
            />
          </div>
        ))}
      </Slider>

      <div className="flex justify-end-safe pe-2 mt-6 gap-4">
        <Button
          className="min-w-32 text-neutral-0 bg-neutral-600 font-medium cursor-pointer"
          variant="outline"
          onClick={previous}
        >
          Previous
        </Button>
        <Button
          className="min-w-32 text-neutral-0 bg-neutral-600 font-medium cursor-pointer"
          variant="outline"
          onClick={next}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
