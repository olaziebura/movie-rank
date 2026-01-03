"use client";

import { useRef, useState, useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import type { Movie } from "@/types/movie";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";

type TopUpcomingMoviesProps = {
  movies: Movie[];
};

export function TopUpcomingMovies({ movies }: TopUpcomingMoviesProps) {
  const sliderRef = useRef<Slider>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoplayEnabled, setAutoplayEnabled] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize autoplay after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setAutoplayEnabled(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Reset autoplay timer when user interacts
  const resetAutoplayTimer = () => {
    setAutoplayEnabled(false);
    
    if (autoplayTimerRef.current) {
      clearTimeout(autoplayTimerRef.current);
    }

    autoplayTimerRef.current = setTimeout(() => {
      setAutoplayEnabled(true);
    }, 5000);
  };

  // Handle mouse wheel scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Check for horizontal scroll (touchpad swipe)
      if (Math.abs(e.deltaX) > 10) {
        e.preventDefault();
        if (e.deltaX > 0) {
          // Scrolling right
          sliderRef.current?.slickNext();
        } else {
          // Scrolling left
          sliderRef.current?.slickPrev();
        }
        resetAutoplayTimer();
      } else if (Math.abs(e.deltaY) > 10) {
        // Vertical scroll converted to horizontal
        e.preventDefault();
        if (e.deltaY > 0) {
          sliderRef.current?.slickNext();
        } else {
          sliderRef.current?.slickPrev();
        }
        resetAutoplayTimer();
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // Handle touch/mouse drag scrolling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startX = 0;
    let currentX = 0;

    const handleMouseDown = (e: MouseEvent) => {
      setIsDragging(true);
      startX = e.pageX;
      currentX = e.pageX;
      container.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      currentX = e.pageX;
    };

    const handleMouseUp = () => {
      if (isDragging) {
        const diff = startX - currentX;
        if (Math.abs(diff) > 50) {
          if (diff > 0) {
            sliderRef.current?.slickNext();
          } else {
            sliderRef.current?.slickPrev();
          }
          resetAutoplayTimer();
        }
      }
      setIsDragging(false);
      container.style.cursor = 'grab';
    };

    const handleMouseLeave = () => {
      setIsDragging(false);
      container.style.cursor = 'grab';
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isDragging]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoplayTimerRef.current) {
        clearTimeout(autoplayTimerRef.current);
      }
    };
  }, []);

  const settings = {
    dots: false,
    infinite: true,
    speed: 600,
    slidesToShow: 5,
    slidesToScroll: 1,
    autoplay: autoplayEnabled,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    arrows: false,
    cssEase: "cubic-bezier(0.4, 0, 0.2, 1)",
    lazyLoad: "progressive" as const,
    waitForAnimate: true,
    responsive: [
      {
        breakpoint: 1536,
        settings: {
          slidesToShow: 4,
        },
      },
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  const handlePrevious = () => {
    sliderRef.current?.slickPrev();
    resetAutoplayTimer();
  };

  const handleNext = () => {
    sliderRef.current?.slickNext();
    resetAutoplayTimer();
  };

  if (!movies || movies.length === 0) {
    return null;
  }

  const topMovies = movies.slice(0, 10);

  // Format release date for upcoming movies
  const formatReleaseDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <section className="py-8 px-0 w-full">
      <div className="max-w-[2000px] mx-auto">
        <div className="flex items-center justify-between mb-6 px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <Clock className="w-7 h-7 md:w-8 md:h-8 text-yellow-400" />
            Top 10 Upcoming Movies
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrevious}
              className="p-2 rounded-full bg-black/40 active:bg-black/70 text-white transition-colors backdrop-blur-sm touch-manipulation lg:hover:bg-black/60"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-full bg-black/40 active:bg-black/70 text-white transition-colors backdrop-blur-sm touch-manipulation lg:hover:bg-black/60"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>

        <div 
          ref={containerRef}
          className="relative cursor-grab active:cursor-grabbing"
        >
          <Slider ref={sliderRef} {...settings}>
            {topMovies.map((movie, index) => (
              <div key={movie.id} className="px-2">
                <Link
                  href={`/movie/${movie.id}`}
                  className="block group relative"
                  onClick={() => resetAutoplayTimer()}
                >
                  <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-neutral-800">
                    {movie.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                        alt={movie.title}
                        className="w-full h-full object-cover transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600">
                        No Image
                      </div>
                    )}
                    
                    {/* Rank Badge */}
                    <div className="absolute top-2 left-2 bg-yellow-400 text-black font-bold text-lg w-10 h-10 rounded-full flex items-center justify-center shadow-lg z-10">
                      {index + 1}
                    </div>

                    {/* Mobile/Tablet: Always visible info (< md) */}
                    <div className="md:hidden absolute bottom-0 inset-x-0 bg-black/85 backdrop-blur-sm p-3">
                      <h3 className="text-white font-bold text-base mb-2 line-clamp-2">
                        {movie.title}
                      </h3>
                      
                      <div className="flex items-center gap-3 text-sm">
                        {movie.release_date && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-yellow-400" />
                            <span className="text-gray-300">
                              {formatReleaseDate(movie.release_date)}
                            </span>
                          </div>
                        )}
                        {movie.vote_average !== undefined && movie.vote_average > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-400 text-base">★</span>
                            <span className="text-white font-semibold">
                              {movie.vote_average.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>

                      {movie.overview && (
                        <p className="text-gray-300 text-xs mt-2 line-clamp-2 leading-relaxed">
                          {movie.overview}
                        </p>
                      )}
                    </div>

                    {/* Desktop: Hover overlay (>= md: ≥1024px) */}
                    <div className="hidden md:block absolute inset-0 bg-black/80 opacity-0 transition-opacity duration-300 flex flex-col justify-center p-4 md:group-hover:opacity-100">
                      <h3 className="text-white font-bold text-xl mb-3 line-clamp-2">
                        {movie.title}
                      </h3>
                      
                      {movie.overview && (
                        <p className="text-gray-300 text-sm mb-3 line-clamp-4 leading-relaxed">
                          {movie.overview}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-3 text-sm">
                        {movie.release_date && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-yellow-400" />
                            <span className="text-gray-300">
                              {formatReleaseDate(movie.release_date)}
                            </span>
                          </div>
                        )}
                        {movie.vote_average !== undefined && movie.vote_average > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-400 text-lg">★</span>
                            <span className="text-white font-semibold">
                              {movie.vote_average.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </section>
  );
}
