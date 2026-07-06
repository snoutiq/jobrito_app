import React from "react";
import { Pressable, StyleSheet, Text, View, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../../constants/colors";

export default function PhoneInput({ value, onChangeText, prefix = "+91", flag = "🇮🇳", onPrefixPress }) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onPrefixPress}
        style={({ pressed }) => [styles.prefix, pressed && styles.prefixPressed]}
      >
        <Text style={styles.flagText}>{flag}</Text>
        <Text style={styles.prefixText}>{prefix}</Text>
        <Ionicons name="chevron-down" size={14} color="#64748B" />
      </Pressable>
      <View style={styles.divider} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="Enter mobile number"
        placeholderTextColor="#94A3B8"
        keyboardType="phone-pad"
        maxLength={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    height: 56,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
  },
  prefix: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    height: "100%",
  },
  prefixPressed: {
    opacity: 0.7,
  },
  flagText: {
    fontSize: 18,
  },
  prefixText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: "#CBD5E1",
    marginHorizontal: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1E293B",
    height: "100%",
    paddingHorizontal: 8,
  },
});
