import React from 'react';
import { View, Text, StyleSheet, SectionList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useMovies } from '../hooks/useMovies';
import MovieCard from '../components/MovieCard';
import MovieFiltersComponent from '../components/MovieFilters';
import { COLORS, SPACING, FONT_SIZES } from '../constants/theme';
import { Movie } from '../types/types';

export default function HomeScreen() {
    const router = useRouter();
    const { movies, theaters, loading, filters, setFilters } = useMovies();

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

    // Group movies by cinema/theater
    const groupMoviesByTheater = () => {
        const uniqueMovies = movies.filter((movie, index, self) => 
            index === self.findIndex(m => `${m.id}-${JSON.stringify(m.showtimes)}` === `${movie.id}-${JSON.stringify(movie.showtimes)}`)
        );
        
        console.log("total movies: ", movies.length);
        console.log("total theaters: ", theaters.length);

        const theaterMoviesMap: { [theaterId: number]: Movie[] } = {};

        theaters.forEach(theater => {
            theaterMoviesMap[theater.id] = [];
        })

        // Go through each movie and its showtimes
        uniqueMovies.forEach(movie => {
    
            // Track which theaters we've added this movie to
            const addedToTheaters = new Set<number>();
    
            movie.showtimes.forEach((showtime: any) => {
            const theaterId = showtime.theater?.id;
            if (theaterId && !addedToTheaters.has(theaterId)) {
                theaterMoviesMap[theaterId].push(movie);
                addedToTheaters.add(theaterId);
                console.log('Added', movie.title, 'to theater', theaterId);
            }
            });
        });
    
        // Log how many movies per theater
        Object.keys(theaterMoviesMap).forEach(theaterId => {
            console.log(`Theater ${theaterId}:`, theaterMoviesMap[Number(theaterId)].length, 'movies');
        });
    
        // Convert to section list format
        const sections = theaters
            .map(theater => ({
            title: theater.name,
            theaterId: theater.id,
            data: theaterMoviesMap[theater.id] || [],
            }))
            .filter(section => section.data.length > 0); // Only include theaters with movies
    
        console.log('Sections created:', sections.length);
        return sections;
        };

        if (loading) {
            return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading movies...</Text>
            </View>
            );
        }

        const sections = groupMoviesByTheater();

        return (
            <View style={styles.container}>
            <Text style={styles.title}>Dr. Cinema</Text>
            <Text style={styles.subtitle}>{movies.length} movies at {sections.length} cinemas</Text>
            
            {/* Filter Button/Modal */}
            <MovieFiltersComponent 
                filters={filters}
                onFiltersChange={setFilters}
            />
        
            {/* Movies grouped by cinema */}
            <SectionList
                sections={sections}
                keyExtractor={(item) => `${item.id}-${Math.random()}`}
                renderItem={({ item }) => (
                <MovieCard
                    movie={item}
                    onPress={() => handleMoviePress(item)}
                />
                )}
                renderSectionHeader={({ section }) => (
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                    🎬 {section.title} ({section.data.length} movies)
                    </Text>
                </View>
                )}
                contentContainerStyle={styles.listContent}
                stickySectionHeadersEnabled={false}
                ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                    No movies found matching your filters.
                    </Text>
                    <Text style={styles.emptySubtext}>
                    Try adjusting your search criteria.
                    </Text>
                </View>
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
            marginBottom: SPACING.xs,
            textAlign: 'center',
        },
        subtitle: {
            fontSize: FONT_SIZES.small,
            color: COLORS.textSecondary,
            marginBottom: SPACING.md,
            textAlign: 'center',
        },
        loadingText: {
            marginTop: SPACING.md,
            color: COLORS.textSecondary,
            fontSize: FONT_SIZES.medium,
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
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        sectionTitle: {
            fontSize: FONT_SIZES.large,
            fontWeight: 'bold',
            color: COLORS.white,
        },
        emptyContainer: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: SPACING.xl * 2,
        },
        emptyText: {
            textAlign: 'center',
            color: COLORS.textPrimary,
            fontSize: FONT_SIZES.large,
            fontWeight: '600',
            marginBottom: SPACING.sm,
        },
        emptySubtext: {
            textAlign: 'center',
            color: COLORS.textSecondary,
            fontSize: FONT_SIZES.medium,
        },
    });