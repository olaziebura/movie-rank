"use client";

import { useState } from "react";
import { X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { SearchFilters } from "@/types/movie";
import { GENRE_IDS, GENRE_NAMES, COUNTRIES } from "@/lib/utils/constants";

type FilterPanelProps = {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
};

export function FilterPanel({
  filters,
  onFiltersChange,
  onClearFilters,
}: FilterPanelProps) {
  const [selectedGenres, setSelectedGenres] = useState<number[]>(
    filters.genres || []
  );

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const handleGenreToggle = (genreId: number) => {
    const newGenres = selectedGenres.includes(genreId)
      ? selectedGenres.filter((id) => id !== genreId)
      : [...selectedGenres, genreId];

    setSelectedGenres(newGenres);
    onFiltersChange({ ...filters, genres: newGenres });
  };

  const handleYearFromChange = (year: string) => {
    const yearNum = year ? parseInt(year) : undefined;
    onFiltersChange({ ...filters, releaseYearFrom: yearNum });
  };

  const handleYearToChange = (year: string) => {
    const yearNum = year ? parseInt(year) : undefined;
    onFiltersChange({ ...filters, releaseYearTo: yearNum });
  };

  const handleCountryChange = (country: string) => {
    onFiltersChange({ ...filters, country: country || undefined });
  };

  const handleRatingChange = (
    min: number | undefined,
    max: number | undefined
  ) => {
    onFiltersChange({
      ...filters,
      minRating: min,
      maxRating: max,
    });
  };

  const handleSortChange = (sortBy: SearchFilters["sortBy"]) => {
    onFiltersChange({ ...filters, sortBy });
  };

  const activeFilterCount =
    (filters.genres?.length || 0) +
    (filters.releaseYearFrom ? 1 : 0) +
    (filters.releaseYearTo ? 1 : 0) +
    (filters.country ? 1 : 0) +
    (filters.minRating ? 1 : 0);

  return (
    <Card className="w-full p-6 h-full bg-white/95 backdrop-blur">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="w-3 h-3 mr-1" />
              Clear All ({activeFilterCount})
            </Button>
          )}
        </div>

        {/* Sort By */}
        <div>
          <Label className="text-xs font-medium text-gray-700 mb-2 block">
            Sort By
          </Label>
          <select
            value={filters.sortBy || "popularity.desc"}
            onChange={(e) =>
              handleSortChange(e.target.value as SearchFilters["sortBy"])
            }
            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs bg-white h-8"
          >
            <option value="popularity.desc">🔥 Most Popular</option>
            <option value="popularity.asc">📉 Least Popular</option>
            <option value="vote_average.desc">⭐ Highest Rated</option>
            <option value="vote_average.asc">📊 Lowest Rated</option>
            <option value="release_date.desc">🆕 Newest First</option>
            <option value="release_date.asc">🕰️ Oldest First</option>
          </select>
        </div>

        {/* All Filters - Column Layout */}
        <div className="space-y-4">
          {/* Year From */}
          <div>
            <Label className="text-xs font-medium text-gray-700 mb-2 block">
              Year From
            </Label>
            <select
              value={filters.releaseYearFrom || ""}
              onChange={(e) => handleYearFromChange(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs bg-white h-8"
            >
              <option value="">Any</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Year To */}
          <div>
            <Label className="text-xs font-medium text-gray-700 mb-2 block">
              Year To
            </Label>
            <select
              value={filters.releaseYearTo || ""}
              onChange={(e) => handleYearToChange(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs bg-white h-8"
            >
              <option value="">Any</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Country */}
          <div>
            <Label className="text-xs font-medium text-gray-700 mb-2 block">
              Country
            </Label>
            <select
              value={filters.country || ""}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs bg-white h-8"
            >
              <option value="">All Countries</option>
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          {/* Min Rating */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-medium text-gray-700">
                Minimum Rating {filters.minRating ? `(${filters.minRating}+)` : ""}
              </Label>
              {filters.minRating && (
                <button
                  onClick={() => handleRatingChange(undefined, filters.maxRating)}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
            <div className="flex gap-1 justify-between">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleRatingChange(rating, filters.maxRating)}
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
        </div>

        <div>
          <Label className="text-xs font-medium text-gray-700 mb-2 block">
            Genres{" "}
            {selectedGenres.length > 0 && (
              <span className="text-blue-600">
                ({selectedGenres.length} selected)
              </span>
            )}
          </Label>
          <div className="flex flex-wrap gap-2 pb-2">
            {Object.entries(GENRE_IDS).map(([, id]) => (
              <Button
                key={id}
                variant={selectedGenres.includes(id) ? "default" : "outline"}
                size="sm"
                onClick={() => handleGenreToggle(id)}
                className={`text-xs whitespace-nowrap h-8 flex-shrink-0 transition-all ${
                  selectedGenres.includes(id)
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                    : "hover:bg-blue-50 hover:border-blue-300"
                }`}
              >
                {GENRE_NAMES[id]}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
