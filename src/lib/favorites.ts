"use client";

const KEY = "favoriteMovieIds";

export function getFavoriteIds(): number[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

export function isFavorite(id: number): boolean {
  return getFavoriteIds().includes(id);
}

export function toggleFavorite(id: number): number[] {
  const ids = new Set(getFavoriteIds());
  if (ids.has(id)) ids.delete(id);
  else ids.add(id);
  const next = Array.from(ids);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}


