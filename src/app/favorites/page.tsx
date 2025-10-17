"use client";

import { useEffect, useState } from "react";
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
      if (ids.length === 0) {
        setMovies([]);
        return;
      }
      const results: TmdbMovie[] = [];
      for (const id of ids) {
        try {
          const m = await getMovie(id);
          results.push(m);
        } catch {
          // ignore
        }
      }
      if (!cancelled) setMovies(results);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">My Favorites</h1>
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {movies === null
          ? Array.from({ length: 8 }).map((_, i) => <MovieSkeleton key={`s-${i}`} />)
          : movies.map((m) => <MovieCard key={m.id} movie={m} />)}
      </div>
    </main>
  );
}


