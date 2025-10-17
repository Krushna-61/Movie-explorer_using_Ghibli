"use client";

import Link from "next/link";
import { useState } from "react";
import { getPosterUrl, TmdbMovie } from "../lib/tmdb";
import { isFavorite, toggleFavorite } from "../lib/favorites";
import Poster from "./Poster";

export default function MovieCard({ movie }: { movie: TmdbMovie }) {
  const [fav, setFav] = useState(() => isFavorite(movie.id));
  const poster = getPosterUrl(movie.poster_path, "w342");

  function onToggle() {
    toggleFavorite(movie.id);
    setFav((f) => !f);
  }

  return (
    <div className="rounded-lg overflow-hidden bg-white/50 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-sm hover:shadow transition-shadow">
      <Link href={`/movie/${movie.id}`} className="block">
        <Poster url={poster} title={movie.title} size={342} />
      </Link>
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold line-clamp-2 flex-1">{movie.title}</h3>
          <span className="text-xs px-2 py-0.5 rounded bg-black/80 text-white dark:bg-white/20 dark:text-white" title="Rating">
            {movie.vote_average.toFixed(1)}
          </span>
        </div>
        <button onClick={onToggle} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          {fav ? "Remove from Favorites" : "Add to Favorites"}
        </button>
      </div>
    </div>
  );
}


