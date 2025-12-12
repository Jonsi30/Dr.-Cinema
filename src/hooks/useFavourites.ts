import { useCallback, useEffect, useState } from 'react';
import { addFavourite, loadFavourites, removeFavourite, reorderFavourites, subscribeFavourites } from '../services/favourites';
import { Movie } from '../types/types';

export default function useFavourites() {
    const [favourites, setFavourites] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
            (async () => {
                const data = await loadFavourites();
                if (!mounted) return;
                setFavourites(data);
                setLoading(false);
            })();
        const unsub = subscribeFavourites((next) => {
            if (!mounted) return;
            setFavourites(next);
        });
        return () => {
            mounted = false;
            unsub();
        };
    }, []);

    const add = useCallback(async (movie: Movie) => {
           const next = await addFavourite(movie);
        setFavourites(next);
        return next;
    }, []);

    const remove = useCallback(async (movieId: string) => {
           const next = await removeFavourite(movieId);
        setFavourites(next);
        return next;
    }, []);

    const move = useCallback(async (fromIndex: number, toIndex: number) => {
           const next = await reorderFavourites(fromIndex, toIndex);
        setFavourites(next);
        return next;
    }, []);

    const refresh = useCallback(async () => {
           const data = await loadFavourites();
        setFavourites(data);
        return data;
    }, []);

    return {
        favourites,
        loading,
        add,
        remove,
        move,
        refresh,
    } as const;
}
