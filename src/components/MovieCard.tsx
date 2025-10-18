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
    <div className="rounded-lg overflow-hidden bg-white/50 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-sm hover:shadow transition-shadow flex flex-col h-full">
      <Link href={`/movie/${movie.id}`} className="block">
        <Poster url={poster} title={movie.title} size={342} />
      </Link>
      <div className="p-3 flex flex-col flex-1">
        {/* header: fixed min-height so title wrap + badge align consistently across cards */}
        <div className="flex items-start justify-between gap-3 min-h-[3.5rem]">
          <h3 className="font-semibold text-center line-clamp-2 flex-1">{movie.title}</h3>
          <span
            className="flex-none ml-2 w-10 h-6 inline-flex items-center justify-center text-xs rounded bg-black/80 text-white dark:bg-white/20 dark:text-white"
            title="Rating"
          >
            {movie.vote_average.toFixed(1)}
          </span>
        </div>
        <button onClick={onToggle} className="mt-auto text-sm text-blue-600 dark:text-blue-400 hover:underline">
          {fav ? "Remove from Favorites" : "Add to Favorites"}
        </button>
      </div>
    </div>
  );
}


