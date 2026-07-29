import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated, Dimensions } from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const IS_SMALL_DEVICE = SCREEN_HEIGHT < 750;

export default function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        {/* Header Pill */}
        <View style={styles.cardHeader}>
          <Animated.View style={[styles.headerPill, { opacity }]} />
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Animated.View style={[styles.avatar, { opacity }]} />
          <Animated.View style={[styles.nameLine, { opacity }]} />
          <Animated.View style={[styles.subLine, { opacity }]} />
        </View>

        {/* Bio Section */}
        <View style={styles.aboutContainer}>
          <Animated.View style={[styles.bioLineFull, { opacity }]} />
          <Animated.View style={[styles.bioLineFull, { opacity }]} />
          <Animated.View style={[styles.bioLineShort, { opacity }]} />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <Animated.View style={[styles.footerButton, { opacity }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.05)",
    overflow: "hidden",
    // Soft IOS shadows
    shadowColor: "rgba(10, 5, 4, 0.1)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    // Android Shadow
    elevation: 3,
  },
  cardContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 28,
    marginBottom: 4,
  },
  headerPill: {
    width: 80,
    height: 18,
    borderRadius: 8,
    backgroundColor: "rgba(10, 5, 4, 0.08)",
  },
  profileSection: {
    alignItems: "center",
    marginVertical: 4,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "rgba(10, 5, 4, 0.08)",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  nameLine: {
    width: 140,
    height: 20,
    borderRadius: 4,
    backgroundColor: "rgba(10, 5, 4, 0.08)",
    marginTop: 12,
  },
  subLine: {
    width: 100,
    height: 12,
    borderRadius: 4,
    backgroundColor: "rgba(10, 5, 4, 0.06)",
    marginTop: 6,
  },
  aboutContainer: {
    marginVertical: 10,
    gap: 6,
  },
  bioLineFull: {
    width: "100%",
    height: 12,
    borderRadius: 4,
    backgroundColor: "rgba(10, 5, 4, 0.06)",
  },
  bioLineShort: {
    width: "60%",
    height: 12,
    borderRadius: 4,
    backgroundColor: "rgba(10, 5, 4, 0.06)",
  },
  cardFooter: {
    backgroundColor: "rgba(10, 5, 4, 0.02)",
    borderTopWidth: 1,
    borderTopColor: "rgba(10, 5, 4, 0.04)",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  footerButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(10, 5, 4, 0.08)",
  },
});
