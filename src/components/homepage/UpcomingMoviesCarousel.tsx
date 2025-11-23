"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { WishlistButton } from "@/components/WishlistButton";
import { useUserProfile } from "@/hooks/useUserProfile";
import Image from "next/image";
import type { FeaturedUpcomingMovie } from "@/lib/supabase/upcomingMovies";

interface UpcomingMoviesCarouselProps {
  className?: string;
}

export function UpcomingMoviesCarousel({
  className = "",
}: UpcomingMoviesCarouselProps) {
  const { profile, userId } = useUserProfile();
  const [movies, setMovies] = useState<FeaturedUpcomingMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string>("");
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch featured upcoming movies (get all 10)
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await fetch(
          "/api/upcoming-movies/featured?sortBy=rank&sortOrder=asc&limit=10"
        );
        const data = await response.json();

        if (data.success) {
          setMovies(data.movies);
          setError("");
        } else {
          setError("Failed to load upcoming movies");
        }
      } catch (err) {
        console.error("Error fetching upcoming movies:", err);
        setError("Unable to connect to the movie service");
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    if (movies.length === 0 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === movies.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Change slide every 5 seconds for smoother experience

    return () => clearInterval(interval);
  }, [movies.length, isPaused]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, movies.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Format release date
  const formatReleaseDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const formattedDate = date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });

    if (diffDays <= 0) {
      return { text: "Available now", color: "text-green-400", date: formattedDate };
    } else if (diffDays === 1) {
      return { text: "Tomorrow", color: "text-yellow-400", date: formattedDate };
    } else if (diffDays <= 7) {
      return { text: `In ${diffDays} days`, color: "text-orange-400", date: formattedDate };
    } else if (diffDays <= 30) {
      const weeks = Math.ceil(diffDays / 7);
      return { text: `In ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`, color: "text-blue-400", date: formattedDate };
    } else {
      const months = Math.ceil(diffDays / 30);
      return { text: `In ${months} ${months === 1 ? 'month' : 'months'}`, color: "text-purple-400", date: formattedDate };
    }
  };

  // Get rank display with Netflix-style large number
  const getRankNumber = (rank: number) => rank;

  // Navigate carousel
  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsPaused(true);
    // Scroll to the selected card
    if (scrollContainerRef.current) {
      const cardWidth = 240; // Approximate width of each card + gap
      scrollContainerRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      });
    }
    // Resume auto-slide after 10 seconds of inactivity
    setTimeout(() => setIsPaused(false), 10000);
  };

  const nextSlide = () => {
    const newIndex = currentIndex === movies.length - 1 ? 0 : currentIndex + 1;
    goToSlide(newIndex);
  };

  const prevSlide = () => {
    const newIndex = currentIndex === 0 ? movies.length - 1 : currentIndex - 1;
    goToSlide(newIndex);
  };

  // Handle manual scroll
  const handleScroll = () => {
    if (scrollContainerRef.current && movies.length > 0) {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const cardWidth = 240;
      const newIndex = Math.round(scrollLeft / cardWidth);
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < movies.length) {
        setCurrentIndex(newIndex);
        setIsPaused(true);
        setTimeout(() => setIsPaused(false), 10000);
      }
    }
  };

  if (loading) {
    return (
      <section className={`py-12 ${className}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              🎬 Top 10 Upcoming Movies Worth Waiting For
            </h2>
            <div className="animate-pulse">
              <div className="h-4 bg-neutral-700 rounded w-64 mx-auto mb-6"></div>
              <div className="h-80 bg-neutral-700 rounded"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || movies.length === 0) {
    return (
      <section className={`py-12 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            🎬 Top 10 Upcoming Movies Worth Waiting For
          </h2>
          <p className="text-gray-400 mb-6">
            {error || "No upcoming movies available at the moment."}
          </p>
        </div>
      </section>
    );
  }

  const currentMovie = movies[currentIndex];

  return (
    <section
      className={`py-12 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">
            🎬 Top 10 Upcoming Movies Worth Waiting For
          </h2>
          <p className="text-gray-300 text-lg">
            AI-curated • Updated every 2 hours
          </p>
        </div>

        {/* Main Carousel */}
        <div className="relative">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-neutral-800/50 to-neutral-700/50 backdrop-blur-sm border border-neutral-600/50">
            <div className="relative h-96 md:h-[500px] transition-all duration-700 ease-out">
              {/* Background Image */}
              {currentMovie.poster_path && (
                <div className="absolute inset-0 transition-opacity duration-700">
                  <Image
                    src={`https://image.tmdb.org/t/p/original${currentMovie.poster_path}`}
                    alt={currentMovie.title}
                    fill
                    className="object-cover opacity-20"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent"></div>
                </div>
              )}

              {/* Content */}
              <div className="relative z-10 h-full flex items-center transition-all duration-700 ease-out">
                <div className="grid md:grid-cols-[auto_1fr] gap-8 w-full p-8">
                  {/* Movie Poster with Netflix-style number */}
                  <div className="flex justify-center items-center relative">
                    {/* Large Netflix-style rank number BEHIND poster - more visible like Netflix */}
                    <div className="absolute -left-16 md:-left-20 top-1/2 -translate-y-1/2 z-0 select-none pointer-events-none">
                      <span className="text-[220px] md:text-[300px] font-black leading-none tracking-tighter" 
                            style={{
                              fontFamily: 'Impact, "Arial Black", sans-serif',
                              WebkitTextStroke: '8px #1a1a1a',
                              WebkitTextFillColor: 'transparent',
                              color: 'transparent',
                              textShadow: `
                                -2px -2px 0 #1a1a1a,
                                2px -2px 0 #1a1a1a,
                                -2px 2px 0 #1a1a1a,
                                2px 2px 0 #1a1a1a,
                                0 0 10px rgba(0, 0, 0, 0.5)
                              `,
                              fontWeight: 900,
                            }}>
                        {getRankNumber(currentMovie.rank_position)}
                      </span>
                    </div>
                    
                    {currentMovie.poster_path ? (
                      <div className="relative z-10 transition-transform duration-500 hover:scale-105">
                        <Image
                          src={`https://image.tmdb.org/t/p/w500${currentMovie.poster_path}`}
                          alt={currentMovie.title}
                          width={300}
                          height={450}
                          className="rounded-lg shadow-2xl object-cover"
                          style={{ aspectRatio: '2/3' }}
                          priority
                        />
                        
                        {/* Wishlist button on poster */}
                        {userId && profile && (
                          <div className="absolute top-3 right-3 bg-black/50 rounded-full p-1 backdrop-blur-sm">
                            <WishlistButton
                              userId={userId}
                              movieId={currentMovie.id}
                              initialIsInWishlist={profile.wishlist.includes(currentMovie.id)}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-72 h-96 bg-neutral-700 rounded-lg flex items-center justify-center relative z-10">
                        <span className="text-neutral-500">Brak obrazu</span>
                      </div>
                    )}
                  </div>

                  {/* Movie Info */}
                  <div className="flex flex-col justify-center space-y-6">
                    <div className="transition-all duration-500">
                      <h3 className="text-4xl md:text-5xl font-bold text-white mb-3">
                        {currentMovie.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 mb-4">
                        <span className="text-yellow-400 text-lg font-semibold flex items-center gap-1" title="TMDB Rating">
                          ⭐ {currentMovie.vote_average.toFixed(1)}/10
                        </span>
                        <div className="group relative">
                          <span className="text-blue-400 text-lg font-semibold flex items-center gap-1 cursor-help">
                            🎯 {currentMovie.curation_score.toFixed(1)}
                          </span>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-3 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-50">
                            <p className="text-xs text-gray-300">
                              <strong className="text-yellow-400">AI Curation Score</strong><br/>
                              Our AI calculates this score based on popularity, rating, release timing, and plot quality. Higher scores indicate movies worth waiting for!
                            </p>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-700"></div>
                          </div>
                        </div>
                        {(() => {
                          const releaseInfo = formatReleaseDate(currentMovie.release_date);
                          return (
                            <div className="flex flex-col">
                              <span className={`${releaseInfo.color} text-lg font-semibold`}>
                                📅 {releaseInfo.text}
                              </span>
                              <span className="text-gray-400 text-sm">
                                {releaseInfo.date}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <p className="text-gray-300 text-lg leading-relaxed line-clamp-4 transition-all duration-500">
                      {currentMovie.overview}
                    </p>

                    <div className="bg-black/40 p-4 rounded-lg border border-yellow-500/20 transition-all duration-500">
                      <p className="text-yellow-400 font-semibold mb-2">
                        Why it&apos;s worth waiting for:
                      </p>
                      <p className="text-gray-200">
                        {currentMovie.curation_reasoning}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm border border-white/20 hover:scale-110 z-20"
            aria-label="Previous movie"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm border border-white/20 hover:scale-110 z-20"
            aria-label="Next movie"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Carousel Indicators */}
        <div className="flex justify-center mt-6 space-x-2">
          {movies.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 ease-out ${
                index === currentIndex
                  ? "bg-yellow-500 w-8 h-3 shadow-lg shadow-yellow-500/50"
                  : "bg-neutral-600 hover:bg-neutral-500 w-3 h-3"
              } rounded-full`}
              aria-label={`Go to movie ${index + 1}`}
            />
          ))}
        </div>

        {/* Horizontal Scrollable Movie Cards */}
        <div className="mt-12 relative">
          <h3 className="text-2xl font-bold text-white mb-6 px-4">
            Scroll to explore all movies
          </h3>
          
          {/* Scroll Container */}
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex gap-4 overflow-x-auto pb-4 pl-12 pr-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-neutral-800 scroll-smooth"
            style={{ 
              scrollbarWidth: 'thin',
              scrollBehavior: 'smooth'
            }}
          >
            {movies.map((movie, index) => {
              const releaseInfo = formatReleaseDate(movie.release_date);
              const isActive = index === currentIndex;
              return (
                <Card
                  key={movie.id}
                  className={`group flex-shrink-0 w-56 bg-neutral-800/50 border-neutral-700 cursor-pointer transition-all duration-300 ease-out snap-start overflow-visible ${
                    isActive ? "scale-105" : "hover:scale-110"
                  }`}
                  onClick={() => goToSlide(index)}
                >
                  <CardContent className="p-0">
                    <div className="relative h-80 overflow-visible">
                      {/* Netflix-style rank number with better font - positioned outside card */}
                      <div className="absolute -left-8 top-2 z-10 select-none pointer-events-none">
                        <span className="text-[140px] font-black leading-none tracking-tighter" 
                              style={{
                                fontFamily: 'Impact, "Arial Black", sans-serif',
                                WebkitTextStroke: '3px rgba(234, 179, 8, 0.5)',
                                color: 'transparent',
                                textShadow: '0 0 30px rgba(0, 0, 0, 0.9)',
                                fontWeight: 900,
                              }}>
                          {getRankNumber(movie.rank_position)}
                        </span>
                      </div>

                      {/* Image container with clip to show number */}
                      <div className="relative h-80 overflow-hidden rounded-t-lg ml-6">
                        {movie.poster_path ? (
                          <>
                            <Image
                              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                              alt={movie.title}
                              fill
                              className="object-cover transition-transform duration-500"
                              sizes="224px"
                            />
                            
                            {/* Hover overlay with movie info */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                              <h4 className="text-white font-bold text-sm mb-2 line-clamp-2">
                                {movie.title}
                              </h4>
                              <div className="space-y-1 text-xs">
                                <p className="text-yellow-400 flex items-center gap-1">
                                  ⭐ {movie.vote_average.toFixed(1)}/10
                                </p>
                                <p className="text-blue-400 flex items-center gap-1" title="AI Curation Score">
                                  🎯 Score: {movie.curation_score.toFixed(1)}
                                </p>
                                <p className={`${releaseInfo.color} font-semibold`}>
                                  📅 {releaseInfo.text}
                                </p>
                              </div>
                            </div>
                            
                            {/* Wishlist button */}
                            {userId && profile && (
                              <div 
                                className="absolute top-2 right-2 bg-black/70 rounded-full p-1 backdrop-blur-sm z-10 transition-all duration-300 hover:scale-110"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <WishlistButton
                                  userId={userId}
                                  movieId={movie.id}
                                  initialIsInWishlist={profile.wishlist.includes(movie.id)}
                                />
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full bg-neutral-700 flex items-center justify-center">
                            <span className="text-neutral-500 text-sm">
                              No image
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-3 bg-neutral-800 ml-6 rounded-b-lg opacity-100 group-hover:opacity-0 transition-opacity duration-300">
                      <h4 className="text-white font-semibold text-sm line-clamp-2 mb-2 min-h-[40px]">
                        {movie.title}
                      </h4>
                      <div className="space-y-1">
                        <p className="text-gray-400 text-xs flex items-center gap-1">
                          <span>⭐ {movie.vote_average.toFixed(1)}</span>
                          <span>•</span>
                          <span>🎯 {movie.curation_score.toFixed(0)}</span>
                        </p>
                        <p className={`${releaseInfo.color} text-xs font-semibold`}>
                          📅 {releaseInfo.text}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {releaseInfo.date}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
