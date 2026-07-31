import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import colors from "../../constants/colors";

export default function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
  numberOfLines = 1,
  secureTextEntry = false,
  containerStyle,
  inputStyle,
  ...textInputProps
}) {
  const { t } = useTranslation();

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{t(label)}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ? t(placeholder) : undefined}
        placeholderTextColor={colors.mutedText}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        secureTextEntry={secureTextEntry}
        style={[styles.input, multiline && styles.multiline, inputStyle]}
        {...textInputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 15,
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: "top",
    paddingVertical: 14,
  },
});
