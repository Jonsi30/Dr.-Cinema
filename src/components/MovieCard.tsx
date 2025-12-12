import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../constants/theme';
import { Movie } from '../types/types';

type MovieCardProps = {
    movie: Movie;
    onPress: () => void;
    actions?: React.ReactNode;
    showGenres?: boolean;
    showYear?: boolean;
    onLongPress?: () => void;
    genres?: string[];
};

export default function MovieCard({ movie, onPress, actions, showGenres = true, showYear = true, onLongPress, genres }: MovieCardProps) {
    const rawRelease = (movie as any).releaseDate ?? (movie as any)["release-dateIS"] ?? (movie as any)["release-date"] ?? (movie as any).release_date;
    let releaseDateFormatted: string | null = null;
    if (rawRelease) {
        try {
            const dt = new Date(String(rawRelease));
            if (!Number.isNaN(dt.getTime())) {
                releaseDateFormatted = dt.toLocaleDateString();
            } else {
                // fallback: try to extract YYYY-MM-DD
                const m = String(rawRelease).match(/(\d{4}-\d{2}-\d{2})/);
                if (m && m[1]) releaseDateFormatted = new Date(m[1]).toLocaleDateString();
            }
        } catch {
            releaseDateFormatted = null;
        }
    }
    // Prefer explicit `genres` prop if provided (AllMovies can pass it), otherwise normalize from movie
    let genresList: string[] = genres ?? [];
    // Normalize genres from different possible shapes so AllMovies and Favourites show them
    if (!genresList || genresList.length === 0) genresList = [];
    try {
        const src: any = movie as any;
        // array of strings or objects
        if (Array.isArray(src.genres) && src.genres.length > 0) {
            genresList = src.genres.map((g: any) => {
                if (!g && g !== 0) return '';
                if (typeof g === 'string') return g.trim();
                if (typeof g === 'number') return String(g);
                if (typeof g === 'object') return String(g.name ?? g.label ?? g.title ?? g.value ?? '').trim();
                return '';
            }).filter(Boolean);
        } else if (typeof src.genres === 'string' && src.genres.trim()) {
            genresList = src.genres.split(',').map((g: string) => g.trim()).filter(Boolean);
        } else if (src.omdb && (typeof src.omdb.Genre === 'string' || typeof src.omdb.genre === 'string') ) {
            const gstr = src.omdb.Genre ?? src.omdb.genre;
            genresList = String(gstr).split(',').map((g: string) => g.trim()).filter(Boolean);
        } else if (typeof src.genre === 'string' && src.genre.trim()) {
            genresList = String(src.genre).split(',').map((g: string) => g.trim()).filter(Boolean);
        } else if (Array.isArray(src.tags) && src.tags.length > 0) {
            genresList = src.tags.map((t: any) => (typeof t === 'string' ? t.trim() : String(t?.name ?? '').trim())).filter(Boolean);
        } else if (src.categories && Array.isArray(src.categories) && src.categories.length > 0) {
            genresList = src.categories.map((c: any) => (typeof c === 'string' ? c.trim() : String(c?.name ?? '').trim())).filter(Boolean);
        }
    } catch {
        // if normalization fails, keep genresList empty
        genresList = [];
    }

    // Fallback: if the source had a genres array but normalization produced nothing,
    // try a permissive mapping to extract any plausible string from each entry.
    try {
        const src: any = movie as any;
        if (Array.isArray(src.genres) && genresList.length === 0) {
            genresList = src.genres.map((g: any) => {
                if (g === null || g === undefined) return '';
                if (typeof g === 'string') return g.trim();
                if (typeof g === 'number') return String(g);
                if (typeof g === 'object') {
                    return String(g.name ?? g.Name ?? g.title ?? g.Title ?? g.genre ?? g.label ?? g.value ?? g.id ?? JSON.stringify(g)).trim();
                }
                return String(g).trim();
            }).filter(Boolean);
            if (genresList.length > 0) {
                // extracted genres successfully
            }
        }
    } catch {
        // fallback extraction failed; ignore
    }

    // If still empty, nothing to display
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} onLongPress={onLongPress}>
        <Image 
            source={{ uri: movie.poster }} 
            style={styles.poster}
            resizeMode="cover"
        />
        <View style={styles.info}>
            <Text style={styles.title}>{movie.title}</Text>
            {showYear ? <Text style={styles.year}>{movie.year}</Text> : null}
            {showGenres && genresList.length > 0 ? (
                <Text style={styles.genres}>{genresList.join(', ')}</Text>
            ) : null}
            {releaseDateFormatted ? (
                <Text style={styles.releaseDate}>Release: {releaseDateFormatted}</Text>
            ) : null}
            {
                // derive an IMDB rating from several possible shapes
                (() => {
                    const src: any = movie as any;
                    let imdbVal: string | number | undefined;
                    if (src.omdb && (src.omdb.imdbRating || src.omdb.imdbRating === 0)) imdbVal = src.omdb.imdbRating;
                    else if (src.ratings && (src.ratings.imdb || src.ratings.imdb === 0)) imdbVal = src.ratings.imdb;
                    else if (src.imdbRating || src.imdbRating === 0) imdbVal = src.imdbRating;
                    if (imdbVal !== undefined && imdbVal !== null && imdbVal !== '') {
                        // normalize to a one-decimal string when numeric
                        let normalized: string | null = null;
                        if (typeof imdbVal === 'number') {
                            normalized = (Math.round(imdbVal * 10) / 10).toString();
                        } else if (typeof imdbVal === 'string') {
                            const s = imdbVal.trim();
                            // treat common non-values as missing
                            if (/^(n\/?a|-|—|unknown|na)$/i.test(s)) {
                                normalized = null;
                            } else {
                                // try to parse numeric values (e.g. "7.8" or "7,8")
                                const num = parseFloat(s.replace(',', '.'));
                                if (!Number.isNaN(num)) normalized = (Math.round(num * 10) / 10).toString();
                                else normalized = s; // keep whatever string (e.g. "7/10")
                            }
                        }
                        if (normalized !== null) return <Text style={styles.rating}>⭐ {normalized}/10</Text>;
                    }
                    return null;
                })()
            }
            
        </View>
        {actions ? <View style={styles.actions}>{actions}</View> : null}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        marginBottom: SPACING.md,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    poster: {
        width: 100,
        height: 150,
    },
    info: {
        flex: 1,
        padding: SPACING.md,
    },
    title: {
        fontSize: FONT_SIZES.medium,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    year: {
        fontSize: FONT_SIZES.small,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs,
    },
    genres: {
        fontSize: FONT_SIZES.small,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs,
    },
    rating: {
        fontSize: FONT_SIZES.small,
        color: '#FFB800',
        fontWeight: '600',
    },
    releaseDate: {
        fontSize: FONT_SIZES.small,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
    },
    actions: {
        width: 56,
        justifyContent: 'center',
        alignItems: 'center',
        paddingRight: SPACING.md,
    },
});