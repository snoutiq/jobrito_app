import React from "react";
import { StyleSheet, Text, View } from "react-native";
import colors from "../../constants/colors";

export default function DashboardStatCard({ label, value }) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 120,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  value: {
    color: colors.primaryDark,
    fontSize: 22,
    fontWeight: "800",
  },
  label: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: "600",
  },
});
