import React from "react";
import { StyleSheet, Text, View } from "react-native";
import colors from "../../constants/colors";

export default function ProfileCompletionCard({ percentage = 0, title, subtitle }) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title || "Profile completion"}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.pill}>
          <Text style={styles.percentage}>{percentage}%</Text>
        </View>
      </View>
      <View style={styles.legendRow}>
        <Text style={styles.legendText}>Profile {percentage}% complete</Text>
        <Text style={styles.legendHint}>Finish your basic details</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 15,
  },
  subtitle: {
    color: colors.mutedText,
    marginTop: 4,
    fontSize: 12,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  percentage: {
    color: colors.primaryDark,
    fontWeight: "800",
    fontSize: 18,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  legendText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  legendHint: {
    color: colors.mutedText,
    fontSize: 12,
    textAlign: "right",
    flexShrink: 1,
  },
  track: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
});
