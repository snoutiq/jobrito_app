import React from "react";
import { Pressable, StyleSheet, Text, View, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../../constants/colors";

export default function PhoneInput({
  value,
  onChangeText,
  prefix = "+91",
  flag = "\u{1F1EE}\u{1F1F3}",
  onPrefixPress,
}) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onPrefixPress}
        style={({ pressed }) => [styles.prefix, pressed && styles.prefixPressed]}
        hitSlop={8}
        accessibilityRole="button"
      >
        <Text style={styles.flagText}>{flag}</Text>
        <Text style={styles.prefixText}>{prefix}</Text>
        <Ionicons name="chevron-down" size={14} color="rgba(10, 5, 4, 0.6)" />
      </Pressable>
      <View style={styles.divider} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="Enter WhatsApp Mobile Number"
        placeholderTextColor="rgba(10, 5, 4, 0.4)"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        autoCorrect={false}
        spellCheck={false}
        returnKeyType="done"
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
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 14,
    height: 56,
    backgroundColor: "#ffffff",
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
    color: "#0a0504",
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(10, 5, 4, 0.15)",
    marginHorizontal: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#0a0504",
    height: "100%",
    paddingHorizontal: 8,
  },
});
