import React, { useRef } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import colors from "../../constants/colors";

export default function OtpInput({ value = "", onChangeText, length = 6 }) {
  const inputRef = useRef(null);
  const digits = value.slice(0, length).split("");

  const handleChange = (text) => {
    const next = text.replace(/\D/g, "").slice(0, length);
    onChangeText?.(next);
  };

  return (
    <Pressable style={styles.wrapper} onPress={() => inputRef.current?.focus()}>
      <View style={styles.boxRow}>
        {Array.from({ length }).map((_, index) => {
          const digit = digits[index] || "";
          const active = index === digits.length || (digits.length === length && index === length - 1);
          return (
            <View
              key={index}
              style={[styles.box, active && styles.boxActive]}
            >
              <Text style={styles.boxText}>{digit}</Text>
            </View>
          );
        })}
      </View>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus
        style={styles.hiddenInput}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        importantForAutofill="yes"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 2,
    paddingBottom: 2,
  },
  boxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    width: "100%",
  },
  box: {
    flex: 1,
    minWidth: 30,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  boxActive: {
    borderColor: colors.primary,
    backgroundColor: "#EEF5FF",
  },
  boxText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },
});
