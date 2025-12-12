import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DraggableFlatList from 'react-native-draggable-flatlist';
import { FavoritesShareButton } from "../src/components/movie/FavoritesShareButton";
import MovieCard from "../src/components/MovieCard";
import { COLORS, FONT_SIZES, SPACING } from "../src/constants/theme";
import useFavourites from "../src/hooks/useFavourites";

interface SharedMovie {
    id: string;
    title?: string;
    year?: string | number;
}

export default function FavouritesPage() {
    const router = useRouter();
    const params = useLocalSearchParams<{ data?: string }>();
    const { favourites, loading, remove, move } = useFavourites();

    const [localData, setLocalData] = useState<any[]>(favourites || []);
    const [isSharedView, setIsSharedView] = useState(false);

    // Detect if opening a shared favourites list
    useEffect(() => {
        if (params.data) {
        try {
            const decoded: SharedMovie[] = JSON.parse(decodeURIComponent(params.data));
            setLocalData(decoded);
            setIsSharedView(true); // read-only
        } catch (err) {
            console.error("Failed to decode shared favourites data", err);
        }
        } else {
        setLocalData(favourites || []);
        setIsSharedView(false);
        }
    }, [params.data, favourites]);

    const handleOpen = (movie: any) => {
        router.push({ pathname: "/movie", params: { movieId: movie.id, movieData: JSON.stringify(movie) } });
    };

    const confirmRemove = (movieId: string, title?: string) => {
        Alert.alert("Remove favourite", `Remove ${title ?? "this movie"} from favourites?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => remove(movieId) },
        ]);
    };

    const renderItem = ({ item }: { item: any }) => (
        <MovieCard
        movie={item}
        onPress={() => handleOpen(item)}
        actions={!isSharedView ? (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <TouchableOpacity onPress={() => confirmRemove(item.id, item.title)}>
                <MaterialIcons name="delete" size={22} color="#d9534f" />
            </TouchableOpacity>
            </View>
        ) : null}
        />
    );

    return (
        <View style={styles.container}>
        <Text style={styles.header}>{isSharedView ? "Shared Favourites" : "Favourites"}</Text>

        {/* Share button: only in normal mode and if there are favourites */}
        {!isSharedView && favourites.length > 0 && (
            <FavoritesShareButton favorites={favourites.map(f => ({ ...f, id: String(f.id) }))} />
        )}

        {/* Loading indicator */}
        {loading && !isSharedView ? (
            <Text style={styles.loading}>Loading…</Text>
        ) : (
            !isSharedView && DraggableFlatList ? (
            <DraggableFlatList
                data={localData}
                keyExtractor={(i: any, idx: number) => `${i.id}-${idx}`}
                renderItem={({ item, index, drag, isActive }: any) => (
                <View style={[isActive ? { opacity: 0.95 } : undefined]}>
                    <MovieCard
                    movie={item}
                    onPress={() => handleOpen(item)}
                    onLongPress={drag}
                    actions={
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                        <TouchableOpacity onPress={() => confirmRemove(item.id, item.title)}>
                            <MaterialIcons name="delete" size={22} color="#d9534f" />
                        </TouchableOpacity>
                        </View>
                    }
                    />
                </View>
                )}
                onDragEnd={({ data, from, to }: any) => {
                setLocalData(data);
                move(from, to);
                }}
            />
            ) : (
            <FlatList
                data={localData}
                keyExtractor={(i: any, idx: number) => `${i.id}-${idx}`}
                renderItem={renderItem}
                contentContainerStyle={localData.length === 0 ? styles.emptyContainer : undefined}
                ListEmptyComponent={<Text style={styles.emptyText}>{isSharedView ? "No movies in shared list." : "No favourites yet."}</Text>}
            />
            )
        )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: SPACING.lg,
    },
    header: {
        fontSize: FONT_SIZES.xlarge,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: SPACING.md,
        color: COLORS.textPrimary,
    },
    loading: {
        textAlign: 'center',
        color: COLORS.textSecondary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: SPACING.xl,
    },
    emptyText: {
        color: COLORS.textSecondary,
    },
});
