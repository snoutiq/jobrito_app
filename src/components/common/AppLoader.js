import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import colors from "../../constants/colors";

export default function AppLoader({ label = "Loading" }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 12,
  },
  text: {
    color: colors.mutedText,
    fontSize: 18,
    fontWeight: "600",
  },
});
