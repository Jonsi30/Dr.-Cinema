import React from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { COLORS, FONT_SIZES, SPACING } from "../../constants/theme";
import { Trailer } from "../../types/types";

interface MovieTrailerProps {
  trailers?: Trailer[];
}

export const MovieTrailer: React.FC<MovieTrailerProps> = ({ trailers }) => {
  if (!trailers || trailers.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Trailer</Text>
        <Text style={styles.emptyState}>No trailer available for this movie</Text>
      </View>
    );
  }

  const trailer = trailers[0];

  const handleWatch = () => {
    Linking.openURL(trailer.url).catch(() => {
      alert("Unable to open trailer");
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Trailer</Text>
      <Text style={styles.watchButton} onPress={handleWatch}>
        Watch Trailer
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  label: {
    fontSize: FONT_SIZES.medium,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  emptyState: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },
  watchButton: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.primary,
    fontWeight: "600",
  },
});
