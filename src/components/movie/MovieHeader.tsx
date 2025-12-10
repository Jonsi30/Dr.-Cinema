import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { COLORS, FONT_SIZES, SPACING } from "../../constants/theme";

interface MovieHeaderProps {
  poster?: string;
  title: string;
  year?: number;
  rating?: string;
  duration?: number;
  country?: string;
}

export const MovieHeader: React.FC<MovieHeaderProps> = ({
  poster,
  title,
  year,
  rating,
  duration,
  country,
}) => {
  return (
    <View style={styles.container}>
      {poster && <Image source={{ uri: poster }} style={styles.poster} />}

      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>

        <View style={styles.details}>
          {year && <Text style={styles.detail}>{year}</Text>}
          {rating && <Text style={styles.detail}>{rating}</Text>}
          {duration && <Text style={styles.detail}>{duration} min</Text>}
          {country && <Text style={styles.detail}>{country}</Text>}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  poster: {
    width: "100%",
    height: 300,
    borderRadius: 8,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.border,
  },
  info: {
    gap: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.xlarge,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  details: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  detail: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
