import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchMovieById, fetchMovieShowtimes } from "../api/movies";
import { Movie, ShowTime } from "../types/types";

interface UseMovieResult {
  movie: Movie | null;
  showtimes: ShowTime[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useMovie = (movieId: string, cinemaId?: string): UseMovieResult => {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<ShowTime[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stableId = useMemo(() => movieId, [movieId]);
  const stableCinemaId = useMemo(() => cinemaId, [cinemaId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [movieData, showtimesData] = await Promise.all([
        fetchMovieById(stableId),
        stableCinemaId ? fetchMovieShowtimes(stableId, stableCinemaId) : Promise.resolve([]),
      ]);

      setMovie(movieData);
      setShowtimes(showtimesData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [stableId, stableCinemaId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    movie,
    showtimes,
    loading,
    error,
    refresh: load,
  };
};
