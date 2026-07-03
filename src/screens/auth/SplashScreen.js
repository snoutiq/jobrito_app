import React from "react";
import { StyleSheet, Text, View } from "react-native";
import colors from "../../constants/colors";
import AppLoader from "../../components/common/AppLoader";
import ScreenWrapper from "../../components/common/ScreenWrapper";

export default function SplashScreen() {
  return (
    <ScreenWrapper scroll={false} contentStyle={styles.container}>
      <View style={styles.brandMark}>
        <Text style={styles.brandText}>JC</Text>
      </View>
      <Text style={styles.title}>JobRito</Text>
      <Text style={styles.subtitle}>Hospitality workforce platform</Text>
      <AppLoader label="Loading app" />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
  },
  brandMark: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: "600",
  },
});
