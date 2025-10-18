import { NextResponse } from 'next/server';

const TMDB_BASE = 'https://api.themoviedb.org/3';

export async function GET(req: Request, context: any) {
  // `context.params` must be awaited in Next's Route Handlers before use.
  const params = await context.params;
  const segments = params?.segments ?? [];
  const path = '/' + segments.join('/');

  try {
    const url = new URL(req.url);
    const qp = url.searchParams;

    // Use server-only env var
    const apiKey = process.env.NEXT_TMDB_API_KEY ?? process.env.NEXT_PUBLIC_TMDB_API_KEY ?? '';
    
    if (!apiKey) {
      // No API key, return sample data
      return getSampleData(path);
    }

    qp.set('api_key', apiKey);
    const target = `${TMDB_BASE}${path}?${qp.toString()}`;
    
    try {
      const res = await fetch(target);
      const body = await res.text();

      if (!res.ok) {
        // For single-movie lookups, do NOT substitute sample data – return 404/Upstream error
        if (path.startsWith('/movie/') && path !== '/movie/popular') {
          return NextResponse.json({ error: 'Not found' }, { status: res.status || 404 });
        }
        // Collections (popular/search) can still fall back to sample data
        return getSampleData(path);
      }

      return new NextResponse(body, {
        status: res.status,
        headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json' },
      });
    } catch (fetchError) {
      // Network failure: collections can fall back; single-movie should not
      if (path.startsWith('/movie/') && path !== '/movie/popular') {
        return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
      }
      return getSampleData(path);
    }
  } catch (err) {
    return NextResponse.json({ error: 'Route error', details: String(err) }, { status: 500 });
  }
}

function getSampleData(path: string) {
  try {
    const fs = require('fs');
    const pathModule = require('path');
    
    // Determine which sample file to use based on the path
    let sampleFile = 'sample-popular.json';
    if (path.startsWith('/movie/') && path !== '/movie/popular') {
      sampleFile = 'sample-movies.json';
    }
    
    const samplePath = pathModule.join(process.cwd(), 'src', 'data', sampleFile);
    const sampleData = fs.readFileSync(samplePath, 'utf8');
    const sample = JSON.parse(sampleData);
    
    // If it's a single movie request, try to return the matching id (best-effort)
    if (path.startsWith('/movie/') && path !== '/movie/popular') {
      const idStr = path.replace('/movie/', '');
      const movies = (Array.isArray(sample) ? sample : sample.results || []) as Array<{ id: number }>
      const match = movies.find((m) => String(m.id) === idStr);
      if (match) return NextResponse.json(match, { status: 200 });
      // If no match, return 404 instead of substituting unrelated sample
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    
    return NextResponse.json(sample, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Sample data fallback failed', details: String(err) }, { status: 500 });
  }
}
