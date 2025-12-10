import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, FONT_SIZES, SPACING } from "../../constants/theme";

interface MovieMetaProps {
  directors?: (string | { Name?: string; NameEN?: string })[];
  writers?: (string | { Name?: string; NameEN?: string })[];
  actors?: (string | { Name?: string; NameEN?: string })[];
  genres?: (string | { Name?: string; NameEN?: string })[];
  ratings?: {
    imdb?: number | string;
    rottenTomatoes?: number | string;
    user?: number | string;
  };
}

const extractName = (item: string | { Name?: string; NameEN?: string }): string => {
  if (typeof item === "string") return item;
  return item?.Name || item?.NameEN || "";
};

export const MovieMeta: React.FC<MovieMetaProps> = ({
  directors,
  writers,
  actors,
  genres,
  ratings,
}) => {
  const directorNames = directors?.map(extractName).filter(Boolean) || [];
  const writerNames = writers?.map(extractName).filter(Boolean) || [];
  const actorNames = actors?.map(extractName).filter(Boolean) || [];
  const genreNames = genres?.map(extractName).filter(Boolean) || [];

  return (
    <View style={styles.container}>
      {directorNames.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.label}>Directors</Text>
          <Text style={styles.value}>{directorNames.join(", ")}</Text>
        </View>
      )}

      {writerNames.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.label}>Writers</Text>
          <Text style={styles.value}>{writerNames.join(", ")}</Text>
        </View>
      )}

      {actorNames.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.label}>Actors</Text>
          <Text style={styles.value}>{actorNames.join(", ")}</Text>
        </View>
      )}

      {genreNames.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.label}>Genres</Text>
          <View style={styles.tags}>
            {genreNames.map((genre) => (
              <View key={genre} style={styles.tag}>
                <Text style={styles.tagText}>{genre}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {ratings && (
        <View style={styles.section}>
          <Text style={styles.label}>Ratings</Text>
          <View style={styles.ratingRow}>
            {ratings.imdb !== undefined && ratings.imdb !== null && (
              <View style={styles.ratingItem}>
                <Text style={styles.ratingLabel}>IMDb</Text>
                <Text style={styles.ratingValue}>
                  {typeof ratings.imdb === "number"
                    ? ratings.imdb.toFixed(1)
                    : String(ratings.imdb)}
                </Text>
              </View>
            )}
            {ratings.rottenTomatoes !== undefined && ratings.rottenTomatoes !== null && (
              <View style={styles.ratingItem}>
                <Text style={styles.ratingLabel}>Rotten Tomatoes</Text>
                <Text style={styles.ratingValue}>
                  {typeof ratings.rottenTomatoes === "number"
                    ? `${ratings.rottenTomatoes}%`
                    : String(ratings.rottenTomatoes)}
                </Text>
              </View>
            )}
            {ratings.user !== undefined && ratings.user !== null && (
              <View style={styles.ratingItem}>
                <Text style={styles.ratingLabel}>User</Text>
                <Text style={styles.ratingValue}>
                  {typeof ratings.user === "number"
                    ? ratings.user.toFixed(1)
                    : String(ratings.user)}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  section: {
    gap: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZES.medium,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  value: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  tag: {
    backgroundColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textPrimary,
  },
  ratingRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  ratingItem: {
    alignItems: "center",
    gap: 4,
  },
  ratingLabel: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
  },
  ratingValue: {
    fontSize: FONT_SIZES.medium,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
});
