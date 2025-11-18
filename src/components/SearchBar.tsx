"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Film, Clock, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TMDBMovie } from "@/types/movie";

type SearchResult = {
  success: boolean;
  query: string;
  page: number;
  total_pages: number;
  total_results: number;
  results: TMDBMovie[];
};

type SearchBarProps = {
  placeholder?: string;
  className?: string;
  onSearchStart?: () => void;
  onSearchComplete?: (results: SearchResult | null) => void;
};

export function SearchBar({ 
  placeholder = "Search for movies...", 
  className = "",
  onSearchStart,
  onSearchComplete,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("movie-search-recent");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error("Failed to load recent searches:", error);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((searchQuery: string) => {
    setRecentSearches(prev => {
      const updated = [searchQuery, ...prev.filter(s => s !== searchQuery)].slice(0, 5);
      localStorage.setItem("movie-search-recent", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Debounced search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults(null);
      onSearchComplete?.(null);
      return;
    }

    setIsSearching(true);
    onSearchStart?.();

    try {
      // Build query parameters - simple search only
      const params = new URLSearchParams();
      params.set("q", searchQuery.trim());
      params.set("mediaType", "all");
      params.set("sortBy", "popularity.desc");
      params.set("page", "1");

      const response = await fetch(`/api/search/movies?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        setResults(data);
        setShowResults(true);
        if (searchQuery.trim()) saveRecentSearch(searchQuery.trim());
        onSearchComplete?.(data);
      } else {
        console.error("Search failed:", data.error);
        setResults(null);
        onSearchComplete?.(null);
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults(null);
      onSearchComplete?.(null);
    } finally {
      setIsSearching(false);
    }
  }, [onSearchStart, onSearchComplete, saveRecentSearch]);

  // Handle input change with debouncing
  const handleInputChange = useCallback((value: string) => {
    setQuery(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 500); // 500ms debounce
  }, [performSearch]);

  // Handle click outside to close results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    // Handle keyboard shortcuts (Ctrl/Cmd + K to focus search)
    function handleKeyboardShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setShowResults(true);
      }
      
      // Escape to close results
      if (event.key === 'Escape') {
        setShowResults(false);
        inputRef.current?.blur();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyboardShortcut);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyboardShortcut);
    };
  }, []);

  // Clear search
  const clearSearch = () => {
    setQuery("");
    setResults(null);
    setShowResults(false);
    onSearchComplete?.(null);
  };

  // Handle Enter key press to redirect to search page
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim().length > 0) {
      setShowResults(false);
      saveRecentSearch(query.trim());
      
      // Build URL with query only
      const params = new URLSearchParams();
      params.set("q", query.trim());
      
      router.push(`/search?${params.toString()}`);
    }
  }, [query, router, saveRecentSearch]);

  // Handle recent search click
  const handleRecentSearchClick = (searchQuery: string) => {
    setQuery(searchQuery);
    performSearch(searchQuery);
    inputRef.current?.focus();
  };

  // Handle result item click to redirect to search page
  const handleViewAllResults = () => {
    if (query.trim().length > 0) {
      setShowResults(false);
      saveRecentSearch(query.trim());
      
      // Build URL with query only
      const params = new URLSearchParams();
      params.set("q", query.trim());
      
      router.push(`/search?${params.toString()}`);
    }
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowResults(true)}
          className="pl-10 pr-20 h-12 text-lg border-2 border-gray-200 focus:border-blue-500 transition-colors bg-white text-gray-900 placeholder:text-gray-500"
        />
        <div className="absolute right-12 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 hidden sm:block">
          ⌘K
        </div>
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto z-50 shadow-lg">
          {/* Show recent searches when no query */}
          {!query && recentSearches.length > 0 && (
            <div className="p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <Clock className="w-4 h-4" />
                <span>Recent Searches</span>
              </div>
              <div className="space-y-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(search)}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-sm"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Show search results */}
          {results && results.results.length > 0 && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>Found {results.total_results} movies</span>
                </div>
                {results.total_results > 10 && (
                  <button 
                    onClick={handleViewAllResults}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View all results
                  </button>
                )}
              </div>
              
              <div className="space-y-3">
                {results.results.slice(0, 5).map((movie) => (
                  <Link
                    key={movie.id}
                    href={`/movie/${movie.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => setShowResults(false)}
                  >
                    <div className="flex-shrink-0">
                      {movie.poster_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                          alt={movie.title}
                          width={40}
                          height={60}
                          className="rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-15 bg-gray-200 rounded flex items-center justify-center">
                          <Film className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {movie.title}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{new Date(movie.release_date).getFullYear()}</span>
                        <span>•</span>
                        <span>★ {movie.vote_average.toFixed(1)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {results.results.length > 5 && (
                <div className="mt-3 pt-3 border-t">
                  <button
                    onClick={handleViewAllResults}
                    className="block w-full text-center py-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View all {results.total_results} results
                  </button>
                </div>
              )}
            </div>
          )}

          {/* No results */}
          {results && results.results.length === 0 && (
            <div className="p-8 text-center">
              <Film className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-medium text-gray-900 mb-1">No movies found</h3>
              <p className="text-sm text-gray-500">
                Try searching with different keywords
              </p>
            </div>
          )}

          {/* Loading state */}
          {isSearching && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-3"></div>
              <p className="text-sm text-gray-500">Searching movies...</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
