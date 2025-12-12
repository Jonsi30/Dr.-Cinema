import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../constants/theme';
import { Movie } from '../types/types';

type MovieCardProps = {
    movie: Movie;
    onPress: () => void;
};

export default function MovieCard({ movie, onPress }: MovieCardProps) {
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
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
        <Image 
            source={{ uri: movie.poster }} 
            style={styles.poster}
            resizeMode="cover"
        />
        <View style={styles.info}>
            <Text style={styles.title}>{movie.title}</Text>
            <Text style={styles.year}>{movie.year}</Text>
            {releaseDateFormatted ? (
                <Text style={styles.releaseDate}>Release: {releaseDateFormatted}</Text>
            ) : null}
            {(movie as any).omdb?.imdbRating && (
            <Text style={styles.rating}>⭐ {(movie as any).omdb.imdbRating}/10</Text>
            )}
        </View>
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
});