import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "../../constants/colors";

export default function AppHeader({
  title,
  subtitle,
  onBackPress,
  rightIcon,
  onRightPress,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.sideSlot}>
        {onBackPress ? (
          <Pressable onPress={onBackPress} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={26} color={colors.text} />
          </Pressable>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>

      <View style={styles.centerSlot}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.sideSlot}>
        {rightIcon && onRightPress ? (
          <Pressable onPress={onRightPress} style={styles.iconButton}>
            <Ionicons name={rightIcon} size={20} color={colors.text} />
          </Pressable>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sideSlot: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 0,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
  },
  centerSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 26,
    textAlign: "center",
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 13,
    lineHeight: 17,
    textAlign: "center",
  },
});
