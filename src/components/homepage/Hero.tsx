"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { HeroWithResults } from "./HeroWithResults";
import { TopPopularMovies } from "./TopPopularMovies";
import type { UserProfile } from "@/types/user";
import type { Movie } from "@/types/movie";

type HeroProps = {
  session?: unknown;
  profile?: UserProfile | null;
  popularMovies?: Movie[] | null;
  trendingMovies?: Movie[] | null;
};

// Pre-defined positions to avoid hydration mismatch
const PARTICLE_CONFIGS = [
  { x: 120, y: 150, duration: 18, delay: 0.5 },
  { x: 340, y: 200, duration: 22, delay: 1.2 },
  { x: 560, y: 180, duration: 16, delay: 2.1 },
  { x: 780, y: 220, duration: 20, delay: 0.8 },
  { x: 200, y: 300, duration: 19, delay: 1.8 },
  { x: 450, y: 350, duration: 17, delay: 2.5 },
  { x: 680, y: 280, duration: 21, delay: 0.3 },
  { x: 900, y: 320, duration: 23, delay: 1.5 },
  { x: 150, y: 400, duration: 18, delay: 2.2 },
  { x: 380, y: 450, duration: 16, delay: 0.9 },
  { x: 620, y: 380, duration: 20, delay: 1.7 },
  { x: 850, y: 420, duration: 19, delay: 2.8 },
];

export const Hero = ({ session, profile, popularMovies, trendingMovies }: HeroProps = {}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative flex flex-col items-center justify-center bg-neutral-800 text-white py-12 px-6 min-h-[600px]">
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-600 to-neutral-800 z-0" />

      <div className="absolute inset-0 overflow-hidden">
        {mounted &&
          PARTICLE_CONFIGS.map((config, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-yellow-400/60"
              initial={{
                x: config.x,
                y: config.y,
                opacity: 0.3,
              }}
              animate={{
                y: -100,
                opacity: 0,
              }}
              transition={{
                duration: config.duration,
                repeat: Infinity,
                delay: config.delay,
                ease: "linear",
              }}
              aria-hidden="true"
            />
          ))}
      </div>

      <div className="relative z-10 w-full pb-8">
        {/* Hero Content */}
        <div className="text-center mb-12">
          <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Discover Your Next
            <br />
            <span className="text-yellow-400">Favorite Movie</span>
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Search through thousands of movies and TV shows with advanced filters
          </motion.p>

          {/* Top 10 Popular Movies Carousel */}
          {trendingMovies && trendingMovies.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <TopPopularMovies movies={trendingMovies} />
            </motion.div>
          )}

          {/* Search Bar with Filters */}
          <motion.div 
            className="w-full mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <HeroWithResults 
              session={session} 
              profile={profile || null}
              popularMovies={popularMovies || null}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
