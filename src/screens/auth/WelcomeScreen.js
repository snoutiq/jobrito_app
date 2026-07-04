import React from "react";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import colors from "../../constants/colors";
import { setSeenOnboarding } from "../../services/storage";

const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuABCVpzBFOuuIbQlQ-a1EzsPrSmAJ_09nJyJ0ducLegQTYzeixlmVz7dss05JjXB1ytoWOzZoXrzlNVbZdrPtaNN7rOv2DWU5Dkj4hBv2DbJPn1-IOlzIcP5QTCfsiDJaWB-HUEJU_MOc1ffbiTQZebvMAcZRKYqZww3rJGBzhaWaEFHZBLfflIZE2wcaBYukFPrGryvk4hU5OiPZ-VSWJvdprV4L8BUimOYP3A-VguJM_cD_VSrLIKBZugQDi0L4F2HQ40nBprtmM3";

export default function WelcomeScreen({navigation }) {

  const handleNext = async () => {
    await setSeenOnboarding();
    navigation.navigate("Role");
  };

  return (
    <ScreenWrapper scroll={false} style={{ backgroundColor: colors.background }} contentStyle={styles.container}>
      <View style={styles.heroArea}>
        <View style={styles.glowOne} />
        <View style={styles.glowTwo} />

        <View style={styles.illustrationWrap}>
          <View style={styles.circleRing} />
          <ImageBackground
            source={{ uri: heroImage }}
            style={styles.heroImage}
            imageStyle={styles.heroImageFill}
            resizeMode="cover"
          >
            <View style={styles.badgeTop}>
              <Ionicons name="restaurant" size={16} color={colors.primary} />
              <Text style={styles.badgeText}>New Chef Role</Text>
            </View>
            <View style={styles.badgeBottom}>
              <Ionicons name="cafe" size={16} color={colors.warning} />
              <Text style={styles.badgeText}>Barista Wanted</Text>
            </View>
          </ImageBackground>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.textBlock}>
          <Text style={styles.title}>Discover Hospitality Jobs</Text>
          <Text style={styles.subtitle}>
            Stay updated with the latest opportunities in the industry. Join thousands of pros finding their next gig.
          </Text>
        </View>

        <View style={styles.indicators}>
          <View style={styles.indicatorActive} />
          <View style={styles.indicator} />
        </View>

        <View style={styles.actions}>
          <Pressable onPress={handleNext} style={styles.nextButton}>
            <Text style={styles.nextText}>Next</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </Pressable>
        </View>
      </View>

      <View style={styles.footerHint} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    justifyContent: "space-between",
  },
  heroArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    overflow: "hidden",
  },
  glowOne: {
    position: "absolute",
    top: 28,
    left: 28,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.primary,
    opacity: 0.08,
  },
  glowTwo: {
    position: "absolute",
    bottom: 46,
    right: 14,
    width: 164,
    height: 164,
    borderRadius: 82,
    backgroundColor: colors.primaryDark,
    opacity: 0.08,
  },
  illustrationWrap: {
    width: "100%",
    maxWidth: 320,
    height: 300,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  circleRing: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#D9E3F6",
    opacity: 0.45,
  },
  heroImage: {
    width: "100%",
    height: 260,
    borderRadius: 32,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: colors.white,
    backgroundColor: colors.card,
  },
  heroImageFill: {
    borderRadius: 28,
  },
  badgeTop: {
    position: "absolute",
    top: 16,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  badgeBottom: {
    position: "absolute",
    left: 14,
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  badgeText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
  },
  textBlock: {
    alignItems: "center",
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 300,
  },
  indicators: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  indicatorActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  actions: {
    gap: 12,
  },
  nextButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  nextText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "900",
  },
  skipButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  skipText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "800",
  },
  footerHint: {
    alignSelf: "center",
    width: 128,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.text,
    opacity: 0.08,
    marginBottom: 8,
  },
});
