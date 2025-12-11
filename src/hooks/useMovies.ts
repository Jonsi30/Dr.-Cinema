import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchMovies, MovieFilters } from "../api/movies";
import { Movie } from "../types/types";

interface UseMoviesResult {
    data: Movie[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export const useMovies = (filters?: MovieFilters): UseMoviesResult => {
    const stableFilters = useMemo(() => filters ?? {}, [filters]);

    const [data, setData] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const movies = await fetchMovies(stableFilters);
            setData(movies);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unknown error";
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [stableFilters]);

    useEffect(() => {
        load();
    }, [load]);

    return {
        data,
        loading,
        error,
        refresh: load,
    };
};
