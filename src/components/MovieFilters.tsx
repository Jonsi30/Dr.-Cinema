import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { MovieFilters } from '../types/types';
import { COLORS, SPACING, FONT_SIZES } from '../constants/theme';

type MovieFiltersProps = {
    filters: MovieFilters;
    onFiltersChange: (filters: MovieFilters) => void;
};

export default function MovieFiltersComponent({ filters, onFiltersChange }: MovieFiltersProps) {
    const [modalVisible, setModalVisible] = useState(false);
    const [localFilters, setLocalFilters] = useState<MovieFilters>(filters);

    const applyFilters = () => {
        onFiltersChange(localFilters);
        setModalVisible(false);
    };

    const clearFilters = () => {
        const emptyFilters: MovieFilters = {};
        setLocalFilters(emptyFilters);
        onFiltersChange(emptyFilters);
        setModalVisible(false);
    };

    return (
        <View>
        <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setModalVisible(true)}
        >
            <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>

        <Modal
            visible={modalVisible}
            animationType="slide"
            transparent={true}
        >
            <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Filter Movies</Text>
                
                <ScrollView style={styles.filtersScroll}>
                {/* Title Filter */}
                <Text style={styles.label}>Title</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Search by title"
                    value={localFilters.title || ''}
                    onChangeText={(text) => setLocalFilters({ ...localFilters, title: text })}
                />

                {/* IMDB Rating */}
                <Text style={styles.label}>IMDB Rating (min)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. 7.0"
                    keyboardType="numeric"
                    value={localFilters.imdbRating?.min.toString() || ''}
                    onChangeText={(text) => setLocalFilters({ 
                    ...localFilters, 
                    imdbRating: { 
                        min: parseFloat(text) || 0, 
                        max: localFilters.imdbRating?.max || 10 
                    }
                    })}
                />

                {/* Rotten Tomatoes Rating */}
                <Text style={styles.label}>Rotten Tomatoes Rating (min %)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. 80"
                    keyboardType="numeric"
                    value={localFilters.tomatoRating?.min.toString() || ''}
                    onChangeText={(text) => setLocalFilters({ 
                    ...localFilters, 
                    tomatoRating: { 
                        min: parseFloat(text) || 0, 
                        max: localFilters.tomatoRating?.max || 100 
                    }
                    })}
                />

                {/* Showtime Range */}
                <Text style={styles.label}>Showtime From (HH:MM)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. 20:00"
                    value={localFilters.showtimeRange?.start || ''}
                    onChangeText={(text) => setLocalFilters({ 
                    ...localFilters, 
                    showtimeRange: { 
                        start: text, 
                        end: localFilters.showtimeRange?.end || '23:59' 
                    }
                    })}
                />
                
                <Text style={styles.label}>Showtime To (HH:MM)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. 22:00"
                    value={localFilters.showtimeRange?.end || ''}
                    onChangeText={(text) => setLocalFilters({ 
                    ...localFilters, 
                    showtimeRange: { 
                        start: localFilters.showtimeRange?.start || '00:00', 
                        end: text 
                    }
                    })}
                />

                {/* Actor Filter */}
                <Text style={styles.label}>Actor</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Search by actor name"
                    value={localFilters.actors?.[0] || ''}
                    onChangeText={(text) => setLocalFilters({ 
                    ...localFilters, 
                    actors: text ? [text] : undefined 
                    })}
                />

                {/* Director Filter */}
                <Text style={styles.label}>Director</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Search by director name"
                    value={localFilters.directors?.[0] || ''}
                    onChangeText={(text) => setLocalFilters({ 
                    ...localFilters, 
                    directors: text ? [text] : undefined 
                    })}
                />

                {/* PG Rating */}
                <Text style={styles.label}>PG Rating</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. PG-13, R"
                    value={localFilters.pgRating || ''}
                    onChangeText={(text) => setLocalFilters({ ...localFilters, pgRating: text })}
                />
                </ScrollView>

                <View style={styles.buttonRow}>
                <TouchableOpacity 
                    style={[styles.button, styles.clearButton]}
                    onPress={clearFilters}
                >
                    <Text style={styles.buttonText}>Clear</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => setModalVisible(false)}
                >
                    <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.button, styles.applyButton]}
                    onPress={applyFilters}
                >
                    <Text style={styles.buttonText}>Apply</Text>
                </TouchableOpacity>
                </View>
            </View>
            </View>
        </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    filterButton: {
        backgroundColor: COLORS.primary,
        padding: SPACING.md,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    filterButtonText: {
        color: COLORS.white,
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: SPACING.lg,
        width: '90%',
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
    },
    filtersScroll: {
        maxHeight: 400,
    },
    label: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginTop: SPACING.md,
        marginBottom: SPACING.sm,
    },
    input: {
        backgroundColor: COLORS.background,
        borderRadius: 8,
        padding: SPACING.md,
        fontSize: FONT_SIZES.medium,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: SPACING.lg,
    },
    button: {
        flex: 1,
        padding: SPACING.md,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: SPACING.xs,
    },
    clearButton: {
        backgroundColor: '#FF9800',
    },
    cancelButton: {
        backgroundColor: '#999',
    },
    applyButton: {
        backgroundColor: COLORS.primary,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
    },
});