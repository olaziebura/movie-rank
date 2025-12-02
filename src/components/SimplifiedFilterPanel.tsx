"use client";

import { useEffect, useState } from "react";
import { X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { SearchFilters } from "@/types/movie";
import { GENRE_IDS, GENRE_NAMES } from "@/lib/utils/constants";

type SimplifiedFilterPanelProps = {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
};

export function SimplifiedFilterPanel({
  filters,
  onFiltersChange,
  onClearFilters,
}: SimplifiedFilterPanelProps) {
  const [selectedGenres, setSelectedGenres] = useState<number[]>(
    filters.genres || []
  );

  // Sync selectedGenres with filters.genres
  useEffect(() => {
    setSelectedGenres(filters.genres || []);
  }, [filters.genres]);

  const handleGenreToggle = (genreId: number) => {
    const newGenres = selectedGenres.includes(genreId)
      ? selectedGenres.filter((id) => id !== genreId)
      : [...selectedGenres, genreId];

    setSelectedGenres(newGenres);
    onFiltersChange({ ...filters, genres: newGenres });
  };

  const handleRatingChange = (min: number | undefined) => {
    onFiltersChange({
      ...filters,
      minRating: min,
    });
  };

  const handleSortChange = (sortBy: SearchFilters["sortBy"]) => {
    onFiltersChange({ ...filters, sortBy });
  };

  const activeFilterCount =
    (filters.genres?.length || 0) +
    (filters.minRating ? 1 : 0) +
    (filters.sortBy && filters.sortBy !== "popularity.desc" ? 1 : 0);

  return (
    <div className="w-full bg-white backdrop-blur rounded-lg p-4 shadow-lg border border-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-gray-900">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full font-medium">
              {activeFilterCount} active
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="w-3 h-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Sort By */}
        <div>
          <Label className="text-xs font-medium text-gray-900 mb-2 block">
            Sort By
          </Label>
          <select
            value={filters.sortBy || "popularity.desc"}
            onChange={(e) =>
              handleSortChange(e.target.value as SearchFilters["sortBy"])
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="popularity.desc">🔥 Most Popular</option>
            <option value="vote_average.desc">⭐ Highest Rated</option>
            <option value="vote_average.asc">📊 Lowest Rated</option>
            <option value="release_date.desc">🆕 Newest First</option>
            <option value="release_date.asc">🕰️ Oldest First</option>
          </select>
        </div>

        {/* Rating */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-medium text-gray-900">
              Minimum Rating {filters.minRating ? `(${filters.minRating}+)` : ""}
            </Label>
            {filters.minRating && (
              <button
                onClick={() => handleRatingChange(undefined)}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
          <div className="flex gap-1.5 justify-between">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
              <button
                key={rating}
                onClick={() => handleRatingChange(rating)}
                className={`transition-all transform hover:scale-110 ${
                  filters.minRating && rating <= filters.minRating
                    ? "text-yellow-400"
                    : "text-gray-300 hover:text-yellow-200"
                }`}
                aria-label={`${rating} stars`}
                title={`${rating} stars minimum`}
              >
                <Star
                  className="w-5 h-5"
                  fill={
                    filters.minRating && rating <= filters.minRating
                      ? "currentColor"
                      : "none"
                  }
                />
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-1 px-1">
            <span className="text-[10px] text-gray-400">1</span>
            <span className="text-[10px] text-gray-400">5</span>
            <span className="text-[10px] text-gray-400">10</span>
          </div>
        </div>

        {/* Genres */}
        <div>
          <Label className="text-xs font-medium text-gray-900 mb-2 block">
            Genres{" "}
            {selectedGenres.length > 0 && (
              <span className="text-blue-600 font-semibold">
                ({selectedGenres.length} selected)
              </span>
            )}
          </Label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(GENRE_IDS).map(([, id]) => (
              <Button
                key={id}
                variant={selectedGenres.includes(id) ? "default" : "outline"}
                size="sm"
                onClick={() => handleGenreToggle(id)}
                className={`text-xs whitespace-nowrap h-8 px-3 transition-all ${
                  selectedGenres.includes(id)
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                    : "bg-white text-gray-900 hover:bg-blue-50 hover:border-blue-300 border-gray-300"
                }`}
              >
                {GENRE_NAMES[id]}
              </Button>
            ))}
          </div>
        </div>

        {/* More Options Link */}
        <div className="pt-2 border-t border-gray-300">
          <p className="text-xs text-gray-700 text-center">
            Looking for more filter options? Use the{" "}
            <a
              href="/search"
              className="text-blue-600 hover:text-blue-700 font-semibold underline"
            >
              Search page
            </a>
            {" "}for advanced filtering
          </p>
        </div>
      </div>
    </div>
  );
}
