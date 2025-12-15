"use client";

import { useState } from "react";
import { X, Star, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { SearchFilters } from "@/types/movie";
import { GENRE_IDS, GENRE_NAMES, COUNTRIES } from "@/lib/utils/constants";

type HorizontalFilterPanelProps = {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
};

export function HorizontalFilterPanel({
  filters,
  onFiltersChange,
  onClearFilters,
}: HorizontalFilterPanelProps) {
  const [selectedGenres, setSelectedGenres] = useState<number[]>(
    filters.genres || []
  );
  const [isExpanded, setIsExpanded] = useState(true); // Always start expanded

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
    <Card className="w-full bg-white/95 backdrop-blur mb-6">
      <div className="p-3 md:p-4">
        {/* Header with collapse button */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm md:text-base font-semibold text-gray-900">Filters</h3>
            {activeFilterCount > 0 && (
              <span className="text-[10px] md:text-xs bg-blue-100 text-blue-700 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-xs text-red-600 active:text-red-700 lg:hover:text-red-700 active:bg-red-50 lg:hover:bg-red-50 h-7 px-2"
              >
                <X className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs h-7 px-2"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Hide</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Show</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Filters - Compact Layout */}
        {isExpanded && (
          <div className="space-y-3">
            {/* First Row: All filters in one line on larger screens */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {/* Sort By - Compact */}
              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Sort
                </Label>
                <select
                  value={filters.sortBy || "popularity.desc"}
                  onChange={(e) =>
                    handleSortChange(e.target.value as SearchFilters["sortBy"])
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-white h-7 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="popularity.desc">🔥 Popular</option>
                  <option value="popularity.asc">📉 Unpopular</option>
                  <option value="vote_average.desc">⭐ Top Rated</option>
                  <option value="vote_average.asc">📊 Low Rated</option>
                  <option value="release_date.desc">🆕 Newest</option>
                  <option value="release_date.asc">🕰️ Oldest</option>
                </select>
              </div>

              {/* Year From - Compact */}
              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  From Year
                </Label>
                <select
                  value={filters.releaseYearFrom || ""}
                  onChange={(e) => handleYearFromChange(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-white h-7 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Any</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year To - Compact */}
              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  To Year
                </Label>
                <select
                  value={filters.releaseYearTo || ""}
                  onChange={(e) => handleYearToChange(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-white h-7 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Any</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Country - Compact */}
              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">
                  Country
                </Label>
                <select
                  value={filters.country || ""}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-white h-7 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All</option>
                  {COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating - Inline */}
              <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-1">
                <div className="flex items-end justify-between h-full">
                  <div className="flex-1">
                    <Label className="text-xs font-medium text-gray-700 mb-1 block">
                      Min Rating {filters.minRating ? `${filters.minRating}★` : ""}
                    </Label>
                    <div className="flex gap-0.5 items-center">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => handleRatingChange(rating, filters.maxRating)}
                          className={`transition-all active:scale-125 touch-manipulation lg:hover:scale-110 ${
                            filters.minRating && rating <= filters.minRating
                              ? "text-yellow-400"
                              : "text-gray-300 lg:hover:text-yellow-200"
                          }`}
                          aria-label={`${rating} stars`}
                          title={`${rating} stars minimum`}
                        >
                          <Star
                            className="w-3 h-3"
                            fill={
                              filters.minRating && rating <= filters.minRating
                                ? "currentColor"
                                : "none"
                            }
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  {filters.minRating && (
                    <button
                      onClick={() => handleRatingChange(undefined, filters.maxRating)}
                      className="text-xs text-blue-600 active:text-blue-800 lg:hover:text-blue-800 ml-1 mb-0.5 touch-manipulation"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Second Row: Genres - More Compact */}
            <div>
              <Label className="text-xs font-medium text-gray-700 mb-1 block">
                Genres{" "}
                {selectedGenres.length > 0 && (
                  <span className="text-blue-600 text-xs">
                    ({selectedGenres.length})
                  </span>
                )}
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(GENRE_IDS).map(([, id]) => (
                  <Button
                    key={id}
                    variant={selectedGenres.includes(id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleGenreToggle(id)}
                    className={`text-xs whitespace-nowrap h-6 px-2.5 py-0 transition-all touch-manipulation ${
                      selectedGenres.includes(id)
                        ? "bg-blue-600 text-white active:bg-blue-700 lg:hover:bg-blue-700 shadow-sm"
                        : "active:bg-blue-50 lg:hover:bg-blue-50 active:border-blue-300 lg:hover:border-blue-300"
                    }`}
                  >
                    {GENRE_NAMES[id]}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
