"use client";

import { useState } from "react";
import { isFavorite, toggleFavorite } from "../lib/favorites";

export default function FavoriteToggle({ movieId }: { movieId: number }) {
  const [fav, setFav] = useState(() => isFavorite(movieId));

  function onToggle() {
    toggleFavorite(movieId);
    setFav((f) => !f);
  }

  return (
    <button
      onClick={onToggle}
      className={`inline-flex items-center gap-2 h-9 px-4 rounded border text-sm transition-colors shadow-sm
        ${fav
          ? 'border-red-200/60 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20'
          : 'border-blue-200/60 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20'}
      `}
      title={fav ? 'Remove from Favorites' : 'Add to Favorites'}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" aria-hidden className="opacity-90">
        <path fill="currentColor" d="M12 21s-6.716-4.39-9.193-8.258C1.14 10.733 1.6 7.6 3.842 6.146 6.2 4.62 8.64 5.64 10 7c1.36-1.36 3.8-2.38 6.158-.854 2.242 1.454 2.702 4.587.035 6.596C18.716 16.61 12 21 12 21z"/>
      </svg>
      <span className="font-medium">{fav ? 'Remove from Favorites' : 'Add to Favorites'}</span>
    </button>
  );
}




