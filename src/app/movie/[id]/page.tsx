import Poster from "../../../components/Poster";
import { getMovie, getPosterUrl } from "../../../lib/tmdb";

type Props = { params: { id: string } };

export default async function MovieDetail({ params }: Props) {
  const movie = await getMovie(params.id);
  const poster = getPosterUrl(movie.poster_path, "w500");
  const POSTER_SIZE = 500 as const;

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 grid md:grid-cols-[300px_1fr] gap-6">
      <div>
        <Poster url={poster} title={movie.title} size={POSTER_SIZE} />
      </div>
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">{movie.title}</h1>
        <div className="text-sm opacity-80">Release: {movie.release_date}</div>
        <div className="text-sm">Rating: {movie.vote_average.toFixed(1)}</div>
        <p className="leading-7 whitespace-pre-wrap">{movie.overview}</p>
      </div>
    </main>
  );
}


