import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function MatchBadge({ score = 85, style }) {
  // Determine color theme based on score range
  const isHighMatch = score >= 80;
  const badgeBg = isHighMatch ? "rgba(21, 62, 105, 0.08)" : "rgba(242, 200, 121, 0.12)";
  const textColor = isHighMatch ? "#153e69" : "#f2c879";

  return (
    <View style={[styles.badge, { backgroundColor: badgeBg }, style]}>
      <Ionicons name="sparkles" size={12} color={textColor} style={styles.icon} />
      <Text style={[styles.text, { color: textColor }]}>{score}% Match</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(21, 62, 105, 0.15)",
    alignSelf: "flex-start",
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: "800",
  },
});
