import TopUpcomingMovies from "@/components/TopUpcomingMovies";

export default function UpcomingMoviesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🎬 Upcoming Movies Feature Test
          </h1>
          <p className="text-gray-300 text-lg">
            Test the &quot;Top 10 Upcoming Movies Worth Waiting For&quot;
            feature
          </p>
        </div>

        <TopUpcomingMovies showStats={true} />
      </div>
    </div>
  );
}
