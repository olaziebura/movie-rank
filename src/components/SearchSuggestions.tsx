"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Search } from "lucide-react";
import Link from "next/link";

const POPULAR_SEARCHES = [
  "Marvel",
  "Star Wars",
  "Christopher Nolan",
  "Tom Hanks",
  "Disney",
  "Horror",
  "Comedy",
  "Action",
  "Sci-Fi",
  "Drama",
  "2024 movies",
  "Oscar winners"
];

type SearchSuggestionsProps = {
  className?: string;
};

export function SearchSuggestions({ className = "" }: SearchSuggestionsProps) {
  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5" />
          Popular Searches
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {POPULAR_SEARCHES.map((search) => (
            <Button
              key={search}
              variant="outline"
              size="sm"
              asChild
              className="text-xs hover:bg-blue-50 hover:border-blue-300"
            >
              <Link 
                href={`/search?q=${encodeURIComponent(search)}`}
                className="flex items-center gap-1"
              >
                <Search className="w-3 h-3" />
                {search}
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
