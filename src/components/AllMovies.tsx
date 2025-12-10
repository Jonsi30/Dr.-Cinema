import React from 'react';
import { View, Text, StyleSheet, SectionList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useMovies } from '../hooks/useMovies';
import MovieCard from '../components/MovieCard';
import MovieFiltersComponent from './MovieFilters';
import { COLORS, SPACING, FONT_SIZES } from '../constants/theme';
import { Movie } from '../types/types';

export default function HomeScreen() {
    const router = useRouter();
    const { movies, theaters, loading, filters, setFilters } = useMovies();

    // Group movies by cinema/theater
    const groupMoviesByTheater = () => {
        const grouped: { [theaterId: number]: Movie[] } = {};

        movies.forEach(movie => {
        movie.showtimes?.forEach(showtime => {
            const theaterId = (showtime as any).theater?.id;
            if (theaterId) {
            if (!grouped[theaterId]) {
                grouped[theaterId] = [];
            }
            if (!grouped[theaterId].find(m => m.id === movie.id)) {
                grouped[theaterId].push(movie);
            }
            }
        });
        });

        // Convert to section list format
        return theaters
        .filter(theater => grouped[theater.id]?.length > 0)
        .map(theater => ({
            title: theater.name,
            data: grouped[theater.id] || [],
        }));
    };

    if (loading) {
        return (
        <View style={[styles.container, styles.centered]}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading movies...</Text>
        </View>
        );
    }

    console.log("Movies", movies)
    const sections = groupMoviesByTheater();
    console.log("sections", sections)

    return (
        <View style={styles.container}>
        <Text style={styles.title}>Movies</Text>
        
        <MovieFiltersComponent 
            filters={filters}
            onFiltersChange={setFilters}
        />

        <SectionList
            sections={sections}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
                console.log("Rendering movie:", item.title);  // Add this debug log
                return <MovieCard movie={item} onPress={() => router.push(`/movie`)} />;
            }}
            renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🎬 {title}</Text>
            </View>
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
            <Text style={styles.emptyText}>
                No movies found. Try adjusting your filters.
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