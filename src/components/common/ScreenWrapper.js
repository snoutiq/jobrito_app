import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import colors from "../../constants/colors";

export default function ScreenWrapper({
  children,
  style,
  contentStyle,
  scroll = true,
  edges = ["top", "left", "right", "bottom"],
  centerContent = false,
  showBottomShadow = false,
}) {
  return (
    <SafeAreaView edges={edges} style={[styles.safeArea, style]}>
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            centerContent && styles.centerContent,
            contentStyle,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View
          style={[
            styles.fill,
            styles.content,
            centerContent && styles.centerContent,
            contentStyle,
          ]}
        >
          {children}
        </View>
      )}
      {showBottomShadow ? <View style={styles.bottomShadow} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 16,
    gap: 16,
  },
  centerContent: {
    alignItems: "center",
  },
  bottomShadow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 18,
    backgroundColor: "#E5E7EB",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    opacity: 0.75,
  },
});
