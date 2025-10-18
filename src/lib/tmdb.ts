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
  // If running on the server, prefer a server-only key to avoid exposing
  // secrets to the browser. Use `NEXT_TMDB_API_KEY` (server-only). Fall
  // back to `NEXT_PUBLIC_TMDB_API_KEY` for client-side usage.
  if (typeof process !== "undefined") {
    const serverKey = process.env.NEXT_TMDB_API_KEY as unknown as string | undefined;
    if (serverKey && serverKey !== "undefined" && serverKey !== "null") return serverKey;
    const publicKey = process.env.NEXT_PUBLIC_TMDB_API_KEY as unknown as string | undefined;
    if (publicKey && publicKey !== "undefined" && publicKey !== "null") return publicKey;
  }
  if (typeof window !== "undefined") {
    const key = (window as unknown as { TMDB_API_KEY?: string }).TMDB_API_KEY;
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

const GHIBLI_BASES = [
  "https://ghibliapi.vercel.app",
  "https://ghibliapi.herokuapp.com",
];

async function fetchGhibliFilms(): Promise<GhibliFilm[]> {
  // Try a couple of known public Ghibli API endpoints. If all fail, return
  // an empty array instead of throwing so the app can degrade gracefully
  // (we'll show no results rather than crashing with a fetch error).
  for (const base of GHIBLI_BASES) {
    try {
      const res = await fetch(`${base}/films`, { cache: "force-cache" });
      if (res.ok) {
        return (await res.json()) as GhibliFilm[];
      }
      } catch (err) {
        // ignore and try next
        console.warn(`Ghibli fetch failed for ${base}:`, err);
    }
  }
  // Last resort: return empty array to avoid throwing a runtime TypeError
  // during client-side fetches when the public API is unreachable.
  // Consumers will see an empty list.
  console.warn("Ghibli API appears to be unreachable; returning empty dataset.");
  return [];
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
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length > 0) params.set(k, String(v));
  });

  // If running in the browser, always proxy through our API route so the
  // client doesn't try to use the Ghibli fallback (which hits CORS in the
  // browser). The server will use the TMDB API key if available.
  const isBrowser = typeof window !== "undefined";
  if (isBrowser) {
    const fetchUrl = `/api/tmdb${path}?${params.toString()}`;
    const res = await fetch(fetchUrl);
    if (!res.ok) throw new Error(`TMDB proxy error ${res.status}`);
    return (await res.json()) as T;
  }

  // Server-side: prefer server API key; if absent, fall back to Ghibli dataset.
  const apiKey = getApiKey();
  if (!apiKey) {
    if (path.startsWith("/movie/") && path !== "/movie/popular") {
      const films = await fetchGhibliFilms();
      const idStr = path.replace("/movie/", "");
      if (films.length > 0) {
        const wanted = films.find((f) => String(hashStringToNumber(f.id)) === idStr);
        if (!wanted) throw new Error("Not found");
        return fromGhibliToMovie(wanted) as unknown as T;
      }
      // fallback to local sample dataset
      try {
        const sample = (await import("../data/sample-movies.json")).default as TmdbMovie[];
        const sm = sample.find((m) => String(m.id) === idStr);
        if (!sm) throw new Error("Not found");
        return sm as unknown as T;
      } catch {
        throw new Error("Not found");
      }
    }
    if (path === "/movie/popular") {
      const page = Number(query.page ?? 1);
      const films = await fetchGhibliFilms();
      let mapped: TmdbMovie[];
      if (films.length > 0) mapped = films.map(fromGhibliToMovie);
      else mapped = (await import("../data/sample-movies.json")).default as TmdbMovie[];
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
      if (films.length > 0) {
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
      // fallback to sample dataset
      const sample = (await import("../data/sample-movies.json")).default as TmdbMovie[];
      const smapped = sample.filter((m) => (q ? m.title.toLowerCase().includes(q) : true));
      const { items, total_pages } = paginateArray(smapped, page, 20);
      return {
        page,
        results: items,
        total_pages,
        total_results: smapped.length,
      } as unknown as T;
    }
    throw new Error("Ghibli route not implemented");
  }

  // Build URL for server-side TMDB request
  params.set("api_key", apiKey);
  const url = `${TMDB_BASE}${path}?${params.toString()}`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
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


