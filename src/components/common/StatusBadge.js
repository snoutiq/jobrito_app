import React from "react";
import { StyleSheet, Text, View } from "react-native";
import colors from "../../constants/colors";

const palette = {
  New: { bg: "#E0F2FE", fg: "#0369A1" },
  Contacted: { bg: "#FEF3C7", fg: "#B45309" },
  Shortlisted: { bg: "#DCFCE7", fg: "#15803D" },
  Hired: { bg: "#D1FAE5", fg: "#047857" },
  Rejected: { bg: "#FEE2E2", fg: "#B91C1C" },
  Pending: { bg: "#F8FAFC", fg: colors.mutedText },
  Approved: { bg: "#DCFCE7", fg: "#15803D" },
  "Pending Approval": { bg: "#FEF3C7", fg: "#B45309" },
  "UNDER REVIEW": { bg: "#FEF3C7", fg: "#B45309" },
  "SHORTLISTED": { bg: "#DCFCE7", fg: "#15803D" },
  "CONTACTED": { bg: "#E0F2FE", fg: "#0369A1" },
  "DECISION PENDING": { bg: "#F1F5F9", fg: "#475569" },
  "JOB CLOSED": { bg: "#FEE2E2", fg: "#B91C1C" },
};

export default function StatusBadge({ status }) {
  const style = palette[status] || { bg: "#E2E8F0", fg: colors.text };
  return (
    <View style={[styles.container, { backgroundColor: style.bg }]}>
      <Text style={[styles.text, { color: style.fg }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
  },
});
