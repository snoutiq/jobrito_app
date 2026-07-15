import React from "react";
import { StyleSheet, Text, View } from "react-native";
import colors from "../../constants/colors";

const palette = {
  New: { bg: "rgba(21, 62, 105, 0.08)", fg: "#153e69" },
  Contacted: { bg: "rgba(242, 200, 121, 0.12)", fg: "#f2c879" },
  Shortlisted: { bg: "rgba(21, 62, 105, 0.08)", fg: "#153e69" },
  Hired: { bg: "rgba(21, 62, 105, 0.08)", fg: "#153e69" },
  Rejected: { bg: "rgba(245, 127, 32, 0.12)", fg: "#f57f20" },
  Pending: { bg: "rgba(242, 200, 121, 0.12)", fg: "#f2c879" },
  Approved: { bg: "rgba(21, 62, 105, 0.08)", fg: "#153e69" },
  "Pending Approval": { bg: "rgba(242, 200, 121, 0.12)", fg: "#f2c879" },
  "UNDER REVIEW": { bg: "rgba(242, 200, 121, 0.12)", fg: "#f2c879" },
  "SHORTLISTED": { bg: "rgba(21, 62, 105, 0.08)", fg: "#153e69" },
  "CONTACTED": { bg: "rgba(242, 200, 121, 0.12)", fg: "#f2c879" },
  "DECISION PENDING": { bg: "rgba(10, 5, 4, 0.08)", fg: "#0a0504" },
  "JOB CLOSED": { bg: "rgba(245, 127, 32, 0.12)", fg: "#f57f20" },
};

export default function StatusBadge({ status }) {
  const norm = String(status || "").toLowerCase().trim();
  const matchKey = Object.keys(palette).find((k) => k.toLowerCase() === norm);
  const style = (matchKey && palette[matchKey]) || { bg: "rgba(10, 5, 4, 0.15)", fg: colors.text };
  
  // Display the status capitalized nicely
  const displayStatus = matchKey || status || "";

  return (
    <View style={[styles.container, { backgroundColor: style.bg }]}>
      <Text style={[styles.text, { color: style.fg }]}>{displayStatus}</Text>
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
    color: "",
  },
});
