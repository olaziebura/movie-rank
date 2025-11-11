import {
  getBatchUpcomingMovies,
  calculateWorthWaitingScore,
} from "../tmdb/upcomingMovies";
import {
  storeFeaturedUpcomingMovies,
  shouldUpdateFeaturedList,
} from "../supabase/upcomingMovies";
import type { Movie } from "@/types/movie";

export interface CurationResult {
  success: boolean;
  moviesProcessed: number;
  featuredMoviesSelected: number;
  duration: string;
  error?: string;
  timestamp: string;
}

export interface CuratedMovie {
  movie: Movie;
  curationScore: number;
  reasoning: string;
  rank: number;
}

export class UpcomingMoviesCurationService {
  private static isRunning = false;
  private static lastCuration: Date | null = null;

  static async curateUpcomingMovies(
    maxPages = 5,
    force = false
  ): Promise<CurationResult> {
    const startTime = Date.now();

    try {
      if (this.isRunning) {
        throw new Error("Curation already in progress");
      }

      if (!force && !(await shouldUpdateFeaturedList())) {
        return {
          success: true,
          moviesProcessed: 0,
          featuredMoviesSelected: 0,
          duration: "0ms",
          timestamp: new Date().toISOString(),
        };
      }

      this.isRunning = true;

      const upcomingMovies = await getBatchUpcomingMovies(maxPages);

      if (upcomingMovies.length === 0) {
        throw new Error("No upcoming movies found to curate");
      }

      const scoredMovies = this.scoreAndRankMovies(upcomingMovies);
      const curatedMovies = this.selectTop10WorthWaitingFor(scoredMovies);
      const storeResult = await storeFeaturedUpcomingMovies(curatedMovies);

      if (!storeResult.success) {
        throw new Error(`Failed to store curated movies: ${storeResult.error}`);
      }

      this.lastCuration = new Date();
      const duration = `${Date.now() - startTime}ms`;

      const result: CurationResult = {
        success: true,
        moviesProcessed: upcomingMovies.length,
        featuredMoviesSelected: curatedMovies.length,
        duration,
        timestamp: new Date().toISOString(),
      };

      console.log("🎉 Curation completed successfully:", result);
      return result;
    } catch (error) {
      console.error("❌ Curation failed:", error);

      return {
        success: false,
        moviesProcessed: 0,
        featuredMoviesSelected: 0,
        duration: `${Date.now() - startTime}ms`,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    } finally {
      this.isRunning = false;
    }
  }

  private static scoreAndRankMovies(movies: Movie[]): Array<{
    movie: Movie;
    score: number;
    reasoning: string;
  }> {
    console.log("⚡ Calculating worth-waiting-for scores...");

    const scoredMovies = movies
      .map((movie) => {
        const { score, reasoning } = calculateWorthWaitingScore(movie);
        return { movie, score, reasoning };
      })
      .sort((a, b) => b.score - a.score);

    console.log(
      `📊 Scored ${scoredMovies.length} movies, top score: ${
        scoredMovies[0]?.score || 0
      }`
    );
    return scoredMovies;
  }

  private static selectTop10WorthWaitingFor(
    scoredMovies: Array<{ movie: Movie; score: number; reasoning: string }>
  ): CuratedMovie[] {
    console.log("🎨 Applying curation logic for diversity and quality...");

    const selected: CuratedMovie[] = [];
    const usedGenres = new Set<number>();
    const minScore = 5;

    for (const { movie, score, reasoning } of scoredMovies) {
      if (selected.length >= 10) break;
      if (score < minScore) continue;

      const movieGenres = movie.genres || [];
      const hasNewGenre = movieGenres.some((genre) => !usedGenres.has(genre));

      if (selected.length < 3 || hasNewGenre || score > 70) {
        selected.push({
          movie,
          curationScore: score,
          reasoning: this.enhanceReasoning(
            reasoning,
            selected.length + 1,
            score
          ),
          rank: selected.length + 1,
        });

        movieGenres.forEach((genre) => usedGenres.add(genre));
      }
    }

    if (selected.length < 10) {
      const selectedIds = new Set(selected.map((item) => item.movie.id));

      for (const { movie, score, reasoning } of scoredMovies) {
        if (selected.length >= 10) break;
        if (selectedIds.has(movie.id)) continue;
        if (score < minScore * 0.8) break;

        selected.push({
          movie,
          curationScore: score,
          reasoning: this.enhanceReasoning(
            reasoning,
            selected.length + 1,
            score
          ),
          rank: selected.length + 1,
        });
      }
    }

    console.log(`✨ Selected ${selected.length} movies for featured list`);
    return selected;
  }

  private static enhanceReasoning(
    baseReasoning: string,
    rank: number,
    score: number
  ): string {
    let prefix = "";

    if (rank === 1) {
      prefix = "🏆 Top Pick: ";
    } else if (rank <= 3) {
      prefix = "🥇 Premium Choice: ";
    } else if (rank <= 6) {
      prefix = "⭐ Highly Recommended: ";
    } else {
      prefix = "🎬 Worth Watching: ";
    }

    return `${prefix}${baseReasoning} (Score: ${score.toFixed(1)})`;
  }

  static getCurationStatus() {
    return {
      isRunning: this.isRunning,
      lastCuration: this.lastCuration,
      nextCurationDue: this.lastCuration
        ? new Date(this.lastCuration.getTime() + 2 * 60 * 60 * 1000)
        : new Date(),
    };
  }

  static shouldCurate(intervalHours = 2): boolean {
    if (!this.lastCuration) return true;

    const timeSinceLastCuration = Date.now() - this.lastCuration.getTime();
    const intervalMs = intervalHours * 60 * 60 * 1000;

    return timeSinceLastCuration >= intervalMs;
  }

  static async forceCuration(maxPages = 5): Promise<CurationResult> {
    console.log("🔄 Force curating upcoming movies...");
    return this.curateUpcomingMovies(maxPages, true);
  }
}

export async function curateUpcomingMovies(
  maxPages = 5
): Promise<CurationResult> {
  return UpcomingMoviesCurationService.curateUpcomingMovies(maxPages);
}

export async function forceCurationUpcomingMovies(
  maxPages = 5
): Promise<CurationResult> {
  return UpcomingMoviesCurationService.forceCuration(maxPages);
}

export function getUpcomingCurationStatus() {
  return UpcomingMoviesCurationService.getCurationStatus();
}
