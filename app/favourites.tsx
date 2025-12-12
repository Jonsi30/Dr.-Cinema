import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DraggableFlatList from 'react-native-draggable-flatlist';
import { COLORS, FONT_SIZES, SPACING } from "../src/constants/theme";
import useFavourites from "../src/hooks/useFavourites";

export default function FavouritesPage() {
  const router = useRouter();
  const { favourites, loading, remove, move } = useFavourites();
  const [localData, setLocalData] = useState<any[]>(favourites || []);

  useEffect(() => {
    setLocalData(favourites || []);
  }, [favourites]);


  const handleOpen = (movie: any) => {
    router.push({ pathname: "/movie", params: { movieId: movie.id, movieData: JSON.stringify(movie) } });
  };

  const confirmRemove = (movieId: string, title?: string) => {
    Alert.alert("Remove favourite", `Remove ${title ?? "this movie"} from favourites?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => remove(movieId) },
    ]);
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.itemRow}>
      <TouchableOpacity style={styles.itemInner} onPress={() => handleOpen(item)}>
        <Image source={{ uri: item.poster }} style={styles.thumb} />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.year}>{item.year}</Text>
          {item.genres ? <Text style={styles.genres} numberOfLines={1}>{(Array.isArray(item.genres) ? item.genres.join(', ') : String(item.genres))}</Text> : null}
        </View>
      </TouchableOpacity>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); move(index, 0); }}
            disabled={index === 0}
          >
            <MaterialIcons name="first-page" size={22} color={index === 0 ? '#ccc' : COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); move(index, Math.max(0, index - 1)); }}
            disabled={index === 0}
          >
            <MaterialIcons name="keyboard-arrow-up" size={24} color={index === 0 ? '#ccc' : COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => confirmRemove(item.id, item.title)}>
            <MaterialIcons name="delete" size={22} color="#d9534f" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); move(index, Math.min(favourites.length - 1, index + 1)); }}
            disabled={index === favourites.length - 1}
          >
            <MaterialIcons name="keyboard-arrow-down" size={24} color={index === favourites.length - 1 ? '#ccc' : COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); move(index, favourites.length - 1); }}
            disabled={index === favourites.length - 1}
          >
            <MaterialIcons name="last-page" size={22} color={index === favourites.length - 1 ? '#ccc' : COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Favourites</Text>

      {loading ? (
        <Text style={styles.loading}>Loading…</Text>
      ) : (
        DraggableFlatList ? (
          <DraggableFlatList
            data={localData}
            keyExtractor={(i: any, idx: number) => `${i.id}-${idx}`}
            renderItem={({ item, index, drag, isActive }: any) => (
              <View style={[styles.itemRow, isActive ? { opacity: 0.95 } : undefined]}>
                <TouchableOpacity style={styles.itemInner} onPress={() => handleOpen(item)} onLongPress={drag}>
                  <Image source={{ uri: item.poster }} style={styles.thumb} />
                  <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.year}>{item.year}</Text>
                    {item.genres ? <Text style={styles.genres} numberOfLines={1}>{(Array.isArray(item.genres) ? item.genres.join(', ') : String(item.genres))}</Text> : null}
                  </View>
                </TouchableOpacity>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => confirmRemove(item.id, item.title)}>
                    <MaterialIcons name="delete" size={22} color="#d9534f" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            onDragEnd={({ data, from, to }: any) => {
              // optimistically update UI then persist order
              setLocalData(data);
              move(from, to);
            }}
          />
        ) : (
          <FlatList
            data={localData}
            keyExtractor={(i: any, idx) => `${i.id}-${idx}`}
            renderItem={renderItem}
            contentContainerStyle={localData.length === 0 ? styles.emptyContainer : undefined}
            ListEmptyComponent={<Text style={styles.emptyText}>No favourites yet.</Text>}
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  itemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  thumb: {
    width: 64,
    height: 96,
    borderRadius: 6,
    marginRight: SPACING.md,
    backgroundColor: '#eee',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  year: {
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  genres: {
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.small,
  },
  actions: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
    gap: SPACING.xs,
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
