export type TmdbMovie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
};

export type TmdbListResponse = {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
};

const TMDB_BASE = "https://api.themoviedb.org/3";

function getApiKey(): string {
  // For simplicity, read from env at build time or window at runtime
  if (typeof process !== "undefined") {
    const v = process.env.NEXT_PUBLIC_TMDB_API_KEY as unknown as string | undefined;
    if (v && v !== "undefined" && v !== "null") return v;
  }
  if (typeof window !== "undefined") {
    // @ts-expect-error
    const key = (window as any).TMDB_API_KEY;
    if (key && key !== "undefined" && key !== "null") return key as string;
  }
  return "";
}

// -------------------------
// Ghibli fallback (no API key)
// -------------------------
type GhibliFilm = {
  id: string;
  title: string;
  description: string;
  release_date: string;
  rt_score: string; // as string
  image?: string; // poster
  movie_banner?: string;
};

const GHIBLI_BASE = "https://ghibliapi.vercel.app";

async function fetchGhibliFilms(): Promise<GhibliFilm[]> {
  const res = await fetch(`${GHIBLI_BASE}/films`, { cache: "force-cache" });
  if (!res.ok) throw new Error("Ghibli API error");
  return (await res.json()) as GhibliFilm[];
}

function fromGhibliToMovie(f: GhibliFilm): TmdbMovie {
  return {
    id: hashStringToNumber(f.id),
    title: f.title,
    overview: f.description,
    poster_path: f.image ?? null,
    vote_average: Number(f.rt_score ? Number(f.rt_score) / 10 : 0),
    release_date: f.release_date,
  };
}

function paginateArray<T>(arr: T[], page: number, size: number): { items: T[]; total_pages: number } {
  const total_pages = Math.max(1, Math.ceil(arr.length / size));
  const start = (page - 1) * size;
  return { items: arr.slice(start, start + size), total_pages };
}

function hashStringToNumber(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

async function tmdbFetch<T>(path: string, query: Record<string, string | number | undefined> = {}): Promise<T> {
  // If no API key, use Ghibli films as a real-data fallback
  const apiKey = getApiKey();
  if (!apiKey) {
    if (path.startsWith("/movie/") && path !== "/movie/popular") {
      const films = await fetchGhibliFilms();
      const idStr = path.replace("/movie/", "");
      const wanted = films.find((f) => String(hashStringToNumber(f.id)) === idStr);
      if (!wanted) throw new Error("Not found");
      return fromGhibliToMovie(wanted) as unknown as T;
    }
    if (path === "/movie/popular") {
      const page = Number(query.page ?? 1);
      const films = await fetchGhibliFilms();
      const mapped = films.map(fromGhibliToMovie);
      const { items, total_pages } = paginateArray(mapped, page, 20);
      return {
        page,
        results: items,
        total_pages,
        total_results: mapped.length,
      } as unknown as T;
    }
    if (path === "/search/movie") {
      const page = Number(query.page ?? 1);
      const q = String(query.query ?? "").toLowerCase();
      const films = await fetchGhibliFilms();
      const filtered = q ? films.filter((f) => f.title.toLowerCase().includes(q)) : films;
      const mapped = filtered.map(fromGhibliToMovie);
      const { items, total_pages } = paginateArray(mapped, page, 20);
      return {
        page,
        results: items,
        total_pages,
        total_results: mapped.length,
      } as unknown as T;
    }
    throw new Error("Ghibli route not implemented");
  }
  const params = new URLSearchParams();
  if (apiKey) params.set("api_key", apiKey);
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length > 0) params.set(k, String(v));
  });
  const url = `${TMDB_BASE}${path}?${params.toString()}`;
  // Avoid Next-specific fetch options in the browser
  const isBrowser = typeof window !== "undefined";
  try {
    const res = await fetch(url, isBrowser ? undefined : { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`TMDB error ${res.status}`);
    return (await res.json()) as T;
  } catch {
    // On failure, best-effort: return Ghibli data
    if (path.startsWith("/movie/") && path !== "/movie/popular") {
      const films = await fetchGhibliFilms();
      const idStr = path.replace("/movie/", "");
      const wanted = films.find((f) => String(hashStringToNumber(f.id)) === idStr);
      if (!wanted) throw new Error("Not found");
      return fromGhibliToMovie(wanted) as unknown as T;
    }
    const page = Number(query.page ?? 1);
    const q = path === "/search/movie" ? String(query.query ?? "").toLowerCase() : "";
    const films = await fetchGhibliFilms();
    const filtered = q ? films.filter((f) => f.title.toLowerCase().includes(q)) : films;
    const mapped = filtered.map(fromGhibliToMovie);
    const { items, total_pages } = paginateArray(mapped, page, 20);
    return {
      page,
      results: items,
      total_pages,
      total_results: mapped.length,
    } as unknown as T;
  }
}

export async function getPopularMovies(page = 1): Promise<TmdbListResponse> {
  return tmdbFetch<TmdbListResponse>("/movie/popular", { page });
}

export async function searchMovies(query: string, page = 1): Promise<TmdbListResponse> {
  return tmdbFetch<TmdbListResponse>("/search/movie", { query, page, include_adult: "false" });
}

export async function getMovie(id: string | number): Promise<TmdbMovie> {
  return tmdbFetch<TmdbMovie>(`/movie/${id}`);
}

export function getPosterUrl(path: string | null, size: "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "original" = "w342"): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}


