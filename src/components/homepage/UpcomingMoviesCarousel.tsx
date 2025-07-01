"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import type { FeaturedUpcomingMovie } from "@/lib/supabase/upcomingMovies";

interface UpcomingMoviesCarouselProps {
  className?: string;
}

export function UpcomingMoviesCarousel({
  className = "",
}: UpcomingMoviesCarouselProps) {
  const [movies, setMovies] = useState<FeaturedUpcomingMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string>("");
  const [isPaused, setIsPaused] = useState(false);

  // Fetch featured upcoming movies
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await fetch(
          "/api/upcoming-movies/featured?sortBy=rank&sortOrder=asc&limit=5"
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
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [movies.length, isPaused]);

  // Format release date
  const formatReleaseDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return "Available Now";
    } else if (diffDays === 1) {
      return "Tomorrow";
    } else if (diffDays <= 7) {
      return `In ${diffDays} days`;
    } else if (diffDays <= 30) {
      return `In ${Math.ceil(diffDays / 7)} weeks`;
    } else {
      return `In ${Math.ceil(diffDays / 30)} months`;
    }
  };

  // Get rank emoji
  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return "🏆";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `#${rank}`;
    }
  };

  // Navigate carousel
  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsPaused(true);
    // Resume auto-slide after 10 seconds of inactivity
    setTimeout(() => setIsPaused(false), 10000);
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === movies.length - 1 ? 0 : prevIndex + 1
    );
    setIsPaused(true);
    // Resume auto-slide after 10 seconds of inactivity
    setTimeout(() => setIsPaused(false), 10000);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? movies.length - 1 : prevIndex - 1
    );
    setIsPaused(true);
    // Resume auto-slide after 10 seconds of inactivity
    setTimeout(() => setIsPaused(false), 10000);
  };

  if (loading) {
    return (
      <section className={`py-12 ${className}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              🎬 Top Upcoming Movies Worth Waiting For
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
            🎬 Top Upcoming Movies Worth Waiting For
          </h2>
          <p className="text-gray-400 mb-6">
            {error || "No upcoming movies available at the moment."}
          </p>
          <Link href="/all-upcoming-movies">
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
              View All Upcoming Movies
            </Button>
          </Link>
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
            🎬 Top Upcoming Movies Worth Waiting For
          </h2>
          <p className="text-gray-300 text-lg">
            Curated by AI • Updated every 2 hours • Top {movies.length} picks
          </p>
        </div>

        {/* Main Carousel */}
        <div className="relative">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-neutral-800/50 to-neutral-700/50 backdrop-blur-sm border border-neutral-600/50">
            <div className="relative h-96 md:h-[500px]">
              {/* Background Image */}
              {currentMovie.poster_path && (
                <div className="absolute inset-0">
                  <Image
                    src={`https://image.tmdb.org/t/p/w1280${currentMovie.poster_path}`}
                    alt={currentMovie.title}
                    fill
                    className="object-cover opacity-20"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
                </div>
              )}

              {/* Content */}
              <div className="relative z-10 h-full flex items-center">
                <div className="grid md:grid-cols-2 gap-8 w-full p-8">
                  {/* Movie Poster */}
                  <div className="flex justify-center">
                    {currentMovie.poster_path ? (
                      <div className="relative">
                        <Image
                          src={`https://image.tmdb.org/t/p/w500${currentMovie.poster_path}`}
                          alt={currentMovie.title}
                          width={300}
                          height={450}
                          className="rounded-lg shadow-2xl"
                          priority
                        />
                        <div className="absolute -top-3 -left-3 bg-yellow-500 text-black px-3 py-1 rounded-full font-bold text-lg">
                          {getRankEmoji(currentMovie.rank_position)}
                        </div>
                      </div>
                    ) : (
                      <div className="w-72 h-96 bg-neutral-700 rounded-lg flex items-center justify-center">
                        <span className="text-neutral-500">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Movie Info */}
                  <div className="flex flex-col justify-center space-y-6">
                    <div>
                      <h3 className="text-4xl md:text-5xl font-bold text-white mb-2">
                        {currentMovie.title}
                      </h3>
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-yellow-400 text-lg">
                          ⭐ {currentMovie.vote_average.toFixed(1)}/10
                        </span>
                        <span className="text-blue-400 text-lg">
                          🎯 {currentMovie.curation_score.toFixed(1)}
                        </span>
                        <span className="text-orange-400 text-lg font-semibold">
                          📅 {formatReleaseDate(currentMovie.release_date)}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-300 text-lg leading-relaxed line-clamp-4">
                      {currentMovie.overview}
                    </p>

                    <div className="bg-black/40 p-4 rounded-lg border border-yellow-500/20">
                      <p className="text-yellow-400 font-semibold mb-2">
                        Why it&apos;s worth waiting for:
                      </p>
                      <p className="text-gray-200">
                        {currentMovie.curation_reasoning}
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <Link href="/all-upcoming-movies">
                        <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-3">
                          See All Top 10
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black px-6 py-3"
                      >
                        Add to Wishlist
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full transition-all duration-200 backdrop-blur-sm border border-white/20"
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
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full transition-all duration-200 backdrop-blur-sm border border-white/20"
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
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? "bg-yellow-500 w-8"
                  : "bg-neutral-600 hover:bg-neutral-500"
              }`}
              aria-label={`Go to movie ${index + 1}`}
            />
          ))}
        </div>

        {/* Movie Cards Row */}
        <div className="mt-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {movies.map((movie, index) => (
              <Card
                key={movie.id}
                className={`bg-neutral-800/50 border-neutral-700 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  index === currentIndex ? "ring-2 ring-yellow-500" : ""
                }`}
                onClick={() => goToSlide(index)}
              >
                <CardContent className="p-3">
                  <div className="relative">
                    {movie.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                        alt={movie.title}
                        width={200}
                        height={300}
                        className="w-full h-48 object-cover rounded mb-2"
                      />
                    ) : (
                      <div className="w-full h-48 bg-neutral-700 rounded mb-2 flex items-center justify-center">
                        <span className="text-neutral-500 text-xs">
                          No Image
                        </span>
                      </div>
                    )}
                    <div className="absolute -top-2 -left-2 bg-yellow-500 text-black px-2 py-1 rounded-full font-bold text-sm">
                      {getRankEmoji(movie.rank_position)}
                    </div>
                  </div>
                  <h4 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                    {movie.title}
                  </h4>
                  <p className="text-gray-400 text-xs">
                    ⭐ {movie.vote_average.toFixed(1)} •{" "}
                    {formatReleaseDate(movie.release_date)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
