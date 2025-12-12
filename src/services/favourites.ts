import AsyncStorage from '@react-native-async-storage/async-storage';
import { Movie } from '../types/types';

const STORAGE_KEY = 'dr-cinema:favourites';

const parse = (v: string | null): Movie[] => {
    if (!v) return [];
    try {
        const parsed = JSON.parse(v);
        if (Array.isArray(parsed)) return parsed as Movie[];
    } catch {
        // ignore
    }
    return [];
};

export const loadFavourites = async (): Promise<Movie[]> => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return parse(raw);
};

export const saveFavourites = async (movies: Movie[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(movies));
};

// Simple in-process pub/sub so different parts of the app can react to changes
type Subscriber = (movies: Movie[]) => void;
const subscribers: Subscriber[] = [];
const notify = (movies: Movie[]) => {
    for (const s of subscribers) {
        try { s(movies); } catch { /* ignore */ }
    }
};

export const subscribeFavourites = (fn: Subscriber) => {
    subscribers.push(fn);
    return () => {
        const idx = subscribers.indexOf(fn);
        if (idx >= 0) subscribers.splice(idx, 1);
    };
};

export const addFavourite = async (movie: Movie) => {
    const current = await loadFavourites();
    const exists = current.find((m) => m.id === movie.id);
    if (exists) return current;
    const next = [...current, movie];
    await saveFavourites(next);
    notify(next);
    return next;
};

export const removeFavourite = async (movieId: string) => {
    const current = await loadFavourites();
    const next = current.filter((m) => String(m.id) !== String(movieId));
    await saveFavourites(next);
    notify(next);
    return next;
};

export const reorderFavourites = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return await loadFavourites();
    const current = await loadFavourites();
    if (fromIndex < 0 || fromIndex >= current.length) return current;
    if (toIndex < 0 || toIndex >= current.length) return current;
    const copy = current.slice();
    const [item] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, item);
    await saveFavourites(copy);
    notify(copy);
    return copy;
};

export default {
    loadFavourites,
    saveFavourites,
    addFavourite,
    removeFavourite,
    reorderFavourites,
};
