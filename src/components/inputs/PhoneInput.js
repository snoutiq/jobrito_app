import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppInput from "./AppInput";
import colors from "../../constants/colors";

export default function PhoneInput({ value, onChangeText, prefix = "+91", onPrefixPress }) {
  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={onPrefixPress}
        style={({ pressed }) => [styles.prefix, pressed && styles.prefixPressed]}
      >
        <Text style={styles.prefixText}>{prefix}</Text>
        <Ionicons name="chevron-down" size={14} color={colors.mutedText} />
      </Pressable>
      <AppInput
        containerStyle={{ flex: 1 }}
        value={value}
        onChangeText={onChangeText}
        placeholder="Enter number"
        keyboardType="phone-pad"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
  },
  prefix: {
    minWidth: 74,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 10,
  },
  prefixPressed: {
    opacity: 0.85,
  },
  prefixText: {
    color: colors.text,
    fontWeight: "700",
  },
});
