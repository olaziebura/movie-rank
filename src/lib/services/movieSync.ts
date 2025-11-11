import { getAllMovieCategories } from "../tmdb/movies";
import { upsertMovies, getMoviesDatabaseStats } from "../supabase/movies";
import type { MovieRecord } from "@/types/movie";

export class MovieSyncService {
  private static isRunning = false;
  private static lastSync: Date | null = null;

  static async syncMoviesToDatabase(maxPages = 5): Promise<{
    success: boolean;
    moviesProcessed: number;
    error?: string;
  }> {
    if (this.isRunning) {
      return {
        success: false,
        moviesProcessed: 0,
        error: "Sync already in progress",
      };
    }

    this.isRunning = true;

    try {
      const movies = await getAllMovieCategories(maxPages);

      if (movies.length === 0) {
        return {
          success: false,
          moviesProcessed: 0,
          error: "No movies fetched",
        };
      }

      const moviesWithTimestamps: MovieRecord[] = movies.map((movie) => ({
        ...movie,
        updated_at: new Date().toISOString(),
      }));

      await this.batchUpsertMovies(moviesWithTimestamps);

      this.lastSync = new Date();

      return { success: true, moviesProcessed: movies.length };
    } catch (error) {
      return {
        success: false,
        moviesProcessed: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    } finally {
      this.isRunning = false;
    }
  }

  private static async batchUpsertMovies(
    movies: MovieRecord[],
    batchSize = 100
  ) {
    const batches = [];

    for (let i = 0; i < movies.length; i += batchSize) {
      batches.push(movies.slice(i, i + batchSize));
    }

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      try {
        await upsertMovies(batch);

        if (i < batches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      } catch (error) {
        throw error;
      }
    }
  }

  static shouldSync(intervalHours = 2): boolean {
    if (!this.lastSync) return true;

    const timeSinceLastSync = Date.now() - this.lastSync.getTime();
    const intervalMs = intervalHours * 60 * 60 * 1000;

    return timeSinceLastSync >= intervalMs;
  }

  static getSyncStatus() {
    return {
      isRunning: this.isRunning,
      lastSync: this.lastSync,
      nextSyncDue: this.lastSync
        ? new Date(this.lastSync.getTime() + 2 * 60 * 60 * 1000)
        : new Date(),
    };
  }

  static async forceSyncMovies(maxPages = 5) {
    return this.syncMoviesToDatabase(maxPages);
  }

  static async getDatabaseHealth() {
    try {
      const stats = await getMoviesDatabaseStats();
      const syncStatus = this.getSyncStatus();

      return {
        ...stats,
        syncStatus,
        healthy: stats.totalMovies > 0,
      };
    } catch (error) {
      return {
        totalMovies: 0,
        lastUpdate: null,
        categories: {},
        syncStatus: this.getSyncStatus(),
        healthy: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export async function syncMoviesManually(maxPages = 3) {
  return MovieSyncService.syncMoviesToDatabase(maxPages);
}

export function isSyncNeeded(intervalHours = 2) {
  return MovieSyncService.shouldSync(intervalHours);
}
