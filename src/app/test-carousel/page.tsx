import { UpcomingMoviesCarousel } from "@/components/homepage/UpcomingMoviesCarousel";

export default function TestCarouselPage() {
  return (
    <div className="min-h-screen bg-neutral-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Test Carousel - Auto-Pause Feature
        </h1>
        <div className="mb-8 p-6 bg-neutral-800 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">
            Testing Instructions:
          </h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>The carousel should auto-slide every 4 seconds by default</li>
            <li>
              Click the left/right arrow buttons - carousel should pause for 10
              seconds
            </li>
            <li>
              Click any of the indicator dots - carousel should pause for 10
              seconds
            </li>
            <li>
              Click any of the movie cards below - carousel should pause for 10
              seconds
            </li>
            <li>After 10 seconds of inactivity, auto-sliding should resume</li>
          </ul>
        </div>
        <UpcomingMoviesCarousel />
      </div>
    </div>
  );
}
