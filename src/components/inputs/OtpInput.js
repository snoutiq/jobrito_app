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
    <View style={styles.wrapper}>
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
        caretHidden={true}
      />
      <View style={styles.boxRow}>
        {Array.from({ length }).map((_, index) => {
          const digit = digits[index] || "";
          const active = index === digits.length || (digits.length === length && index === length - 1);
          return (
            <Pressable
              key={index}
              style={[styles.box, active && styles.boxActive]}
              onPress={() => inputRef.current?.focus()}
            >
              <Text style={styles.boxText}>{digit}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    width: "100%",
    height: 56,
  },
  boxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    width: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  box: {
    flex: 1,
    minWidth: 38,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.15)",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  boxActive: {
    borderColor: "#153e69",
    backgroundColor: "#ffffff",
  },
  boxText: {
    color: "#0a0504",
    fontSize: 18,
    fontWeight: "800",
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    zIndex: 2,
  },
});
