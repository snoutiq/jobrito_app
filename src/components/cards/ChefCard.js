import React from "react";
import { StyleSheet, Text, View } from "react-native";
import colors from "../../constants/colors";
import AppButton from "../buttons/AppButton";

export default function ChefCard({ chef, onPress }) {
  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{chef.name?.charAt(0)}</Text>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.title}>{chef.name}</Text>
        <Text style={styles.subtitle}>{chef.specialty}</Text>
        <Text style={styles.meta}>{chef.city}</Text>
      </View>
      <AppButton title="View Profile" onPress={onPress} style={styles.button} />
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
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.primaryDark,
    fontWeight: "800",
    fontSize: 18,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: "600",
  },
  meta: {
    color: colors.mutedText,
    fontSize: 12,
  },
  button: {
    minHeight: 42,
    paddingHorizontal: 14,
  },
});
