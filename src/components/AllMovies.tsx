import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, Text, View } from 'react-native';
import { MovieFilters } from '../api/movies';
import MovieCard from '../components/MovieCard';
import MovieFiltersComponent from '../components/MovieFilters';
import { COLORS, FONT_SIZES, SPACING } from '../constants/theme';
import { useMovies } from '../hooks/useMovies';
import { Movie } from '../types/types';

export default function HomeScreen() {
    const router = useRouter();
    const [filters, setFilters] = useState<MovieFilters>({});
    const { data: movies, loading, error } = useMovies(filters);

    const handleMoviePress = (movie: Movie) => {
        router.push({
            pathname: "/movie",
            params: { 
                movieId: movie.id,
                movieTitle: movie.title,
                movieData: JSON.stringify(movie),
            },
        });
    };

    // Deduplicate movies at component level as safety measure
    const uniqueMovies = movies ? Array.from(
        new Map(movies.map(m => [m.id, m])).values()
    ) : [];

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading movies...</Text>
            </View>
        );
    }

    if (error || !uniqueMovies || uniqueMovies.length === 0) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Text style={styles.loadingText}>{error || "No movies found"}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Movies</Text>
            
            <MovieFiltersComponent 
                filters={filters}
                onFiltersChange={setFilters}
            />
            
            <SectionList
                sections={[{ title: "", data: uniqueMovies }]}
                renderItem={({ item }) => (
                    <MovieCard 
                        movie={item} 
                        onPress={() => handleMoviePress(item)}
                    />
                )}
                renderSectionHeader={({ section: { title } }) => 
                    title ? (
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>{title}</Text>
                        </View>
                    ) : null
                }
                keyExtractor={(item, index) => `${item.id}-${index}`}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        No movies found.
                    </Text>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: SPACING.lg,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: FONT_SIZES.xlarge,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    loadingText: {
        marginTop: SPACING.md,
        color: COLORS.textSecondary,
    },
    listContent: {
        paddingBottom: SPACING.xl,
    },
    sectionHeader: {
        backgroundColor: COLORS.primary,
        padding: SPACING.md,
        borderRadius: 8,
        marginTop: SPACING.md,
        marginBottom: SPACING.sm,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    emptyText: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.medium,
        marginTop: SPACING.xl,
    },
});