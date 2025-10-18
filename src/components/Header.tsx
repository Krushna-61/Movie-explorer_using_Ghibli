"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useAuth } from "../app/providers";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header() {
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, logout, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  // NOTE: Auth state is client-only (loaded from localStorage in AuthProvider).
  // To avoid a hydration mismatch where the server renders an unauthenticated
  // UI but the client immediately shows the logged-in UI, we wait until the
  // component is mounted and then render auth-dependent controls. Before
  // mount we render a stable placeholder so server and initial client HTML
  // match.

  useEffect(() => {
    setQuery(searchParams?.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    setMounted(true);
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams?.toString());
    if (query) params.set("q", query);
    else params.delete("q");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-black/10 dark:border-white/10 shadow-sm bg-gradient-to-b from-white to-slate-50 backdrop-blur supports-[backdrop-filter]:from-white/80 supports-[backdrop-filter]:to-slate-50/60 dark:bg-black dark:bg-none">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        <Link href="/" className="font-semibold text-lg tracking-tight text-black dark:text-white">Movie Explorer</Link>
        <nav className="ml-auto flex items-center gap-3">
          <form onSubmit={onSubmit} className="hidden sm:flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies..."
              className="border rounded px-3 py-1.5 w-64 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/40 placeholder:text-slate-500
              dark:rounded-full dark:px-4 dark:py-2 dark:w-72 dark:bg-white dark:text-black dark:border-transparent dark:placeholder:text-black/85"
            />
            <button className="h-9 px-3 rounded bg-neutral-900 text-white hover:opacity-90 shadow-sm
            dark:h-9 dark:px-4 dark:rounded-full dark:bg-black dark:text-white dark:border dark:border-white/20">Search</button>
          </form>
          <Link
            href="/favorites"
            className="inline-flex items-center h-9 px-3 rounded border border-black/15 bg-white/60 text-black hover:bg-black/5 shadow-sm
            dark:border-white/20 dark:bg-black dark:text-white dark:hover:bg-black/80"
          >
            My Favorites
          </Link>
          <button
            className="h-9 w-9 grid place-items-center rounded-full border border-black/15 bg-white/60 hover:bg-black/5 text-black shadow-sm
            dark:border-transparent dark:bg-white dark:text-black dark:hover:bg-white/90"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={mounted ? (theme === "dark" ? "Switch to light" : "Switch to dark") : "Toggle theme"}
            title={mounted ? (theme === "dark" ? "Light mode" : "Dark mode") : "Theme"}
          >
            {mounted ? (
              theme === "dark" ? (
                // Moon
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="opacity-90">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                // Sun
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="opacity-90">
                  <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42zM1 13h3v-2H1v2zm10 10h2v-3h-2v3zm9-10v-2h-3v2h3zm-3.95 6.95l1.41 1.41 1.8-1.79-1.41-1.41-1.8 1.79zM12 5a7 7 0 1 0 .001 14.001A7 7 0 0 0 12 5zm7.66-1.34l-1.41 1.41 1.79 1.8 1.41-1.41-1.79-1.8zM4.24 17.66l-1.79 1.8 1.41 1.41 1.8-1.79-1.42-1.42z" />
                </svg>
              )
            ) : (
              // Placeholder dot before mount
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-current opacity-60" />
            )}
          </button>
          {mounted ? (
            isAuthenticated ? (
              <button
                className="h-9 px-3 rounded border border-black/15 bg-white/60 text-black hover:bg-black/5 shadow-sm
            dark:border-white/20 dark:bg-black dark:text-white dark:hover:bg-black/80"
                onClick={logout}
                title={user?.email}
              >
                Logout
              </button>
            ) : (
              <Link className="underline" href="/login">
                Login
              </Link>
            )
          ) : (
            // Render a stable placeholder on server / before mount to avoid hydration mismatch
            <div className="h-9 px-3 rounded" aria-hidden />
          )}
        </nav>
      </div>
      <div className="sm:hidden px-4 pb-3">
        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies..."
            className="border rounded px-3 py-2 flex-1 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/40 placeholder:text-slate-500
            dark:rounded-full dark:px-4 dark:py-2 dark:bg-white dark:text-black dark:border-transparent dark:placeholder:text-black/85"
          />
          <button className="h-10 px-3 rounded bg-neutral-900 text-white hover:opacity-90 shadow-sm
          dark:h-9 dark:px-4 dark:rounded-full dark:bg-black dark:text-white dark:border dark:border-white/20">Go</button>
        </form>
      </div>
    </header>
  );
}


