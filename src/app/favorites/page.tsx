"use client";

import { useEffect, useMemo, useState } from "react";
import { getFavoriteIds } from "../../lib/favorites";
import { getMovie, TmdbMovie } from "../../lib/tmdb";
import MovieCard from "../../components/MovieCard";
import MovieSkeleton from "../../components/MovieSkeleton";

export default function FavoritesPage() {
  const [movies, setMovies] = useState<TmdbMovie[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const ids = getFavoriteIds();
      const uniqueIds = Array.from(new Set(ids));
      if (uniqueIds.length === 0) {
        setMovies([]);
        return;
      }
      const results: TmdbMovie[] = [];
      for (const id of uniqueIds) {
        try {
          const m = await getMovie(id);
          if (!results.some((r) => r.id === m.id)) results.push(m);
        } catch {
          // ignore missing/invalid ids (e.g., legacy sample ids)
        }
      }
      if (!cancelled) setMovies(results);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const uniqueMovies = useMemo(() => {
    if (!movies) return null;
    const byId = new Map<number, TmdbMovie>();
    for (const m of movies) byId.set(m.id, m);
    return Array.from(byId.values());
  }, [movies]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">My Favorites</h1>
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {uniqueMovies === null
          ? Array.from({ length: 8 }).map((_, i) => <MovieSkeleton key={`s-${i}`} />)
          : uniqueMovies.map((m) => <MovieCard key={m.id} movie={m} />)}
      </div>
    </main>
  );
}


