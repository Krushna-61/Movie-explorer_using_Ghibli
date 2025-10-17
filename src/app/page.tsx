"use client";

import { useEffect, useMemo, useState } from "react";
import { getPopularMovies, searchMovies, TmdbMovie } from "../lib/tmdb";
import MovieCard from "../components/MovieCard";
import MovieSkeleton from "../components/MovieSkeleton";
import { useSearchParams } from "next/navigation";

export default function Home() {
  const searchParams = useSearchParams();
  const query = searchParams?.get("q") ?? "";
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<TmdbMovie[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setItems([]);
    setPage(1);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = query
          ? await searchMovies(query, page)
          : await getPopularMovies(page);
        if (!cancelled) {
          setItems((prev) => (page === 1 ? data.results : [...prev, ...data.results]));
          setTotalPages(data.total_pages);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [page, query]);

  const canLoadMore = useMemo(() => page < totalPages, [page, totalPages]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">
        {query ? `Search: "${query}"` : "Popular Movies"}
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map((m) => (
          <MovieCard key={m.id} movie={m} />
        ))}
        {loading &&
          Array.from({ length: 8 }).map((_, i) => <MovieSkeleton key={`s-${i}`} />)}
      </div>
      <div className="flex justify-center py-6">
        {canLoadMore && (
          <button
            className="h-10 px-6 rounded border"
            onClick={() => setPage((p) => p + 1)}
            disabled={loading}
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        )}
      </div>
    </main>
  );
}
