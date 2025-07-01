"use client";

import { useState } from "react";

export default function TestAiChat() {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const testRequest = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      console.log("Testing AI API...");

      const response = await fetch("/api/movies/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customPrompt: "I want a sci-fi movie with time travel",
          userPreferences: {
            minRating: 6.0,
          },
          maxMovies: 2,
        }),
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (response.ok && data.success) {
        setResult(data);
      } else {
        setError(data.error || "Request failed");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl mb-4">AI Chat Test</h1>

      <button
        onClick={testRequest}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Testing..." : "Test AI API"}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-500 rounded">Error: {error}</div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-500 rounded">
          <h2>Success!</h2>
          <p>
            Found{" "}
            {Array.isArray(result.recommendations)
              ? result.recommendations.length
              : 0}{" "}
            recommendations
          </p>
          <pre className="mt-2 text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
