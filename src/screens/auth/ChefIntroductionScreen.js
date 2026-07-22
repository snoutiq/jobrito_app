import React from "react";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import colors from "../../constants/colors";
import chefImage from "../../assets/chef.png";

export default function ChefIntroductionScreen({ navigation }) {
  const { t } = useTranslation();

  const handleNext = () => {
    navigation.navigate("Login");
  };

  const benefits = [
    {
      key: "consulting",
      icon: "analytics-outline",
      iconColor: "#153e69",
      bgColor: "rgba(21, 62, 105, 0.08)",
      title: t("chefIntro.consultingTitle"),
      desc: t("chefIntro.consultingDesc"),
    },
    {
      key: "projects",
      icon: "business-outline",
      iconColor: "#f57f20",
      bgColor: "rgba(245, 127, 32, 0.08)",
      title: t("chefIntro.projectsTitle"),
      desc: t("chefIntro.projectsDesc"),
    },
    {
      key: "networking",
      icon: "people-outline",
      iconColor: "#153e69",
      bgColor: "rgba(21, 62, 105, 0.08)",
      title: t("chefIntro.networkingTitle"),
      desc: t("chefIntro.networkingDesc"),
    },
    {
      key: "visibility",
      icon: "checkmark-circle-outline",
      iconColor: "#f2c879",
      bgColor: "rgba(242, 200, 121, 0.1)",
      title: t("chefIntro.visibilityTitle"),
      desc: t("chefIntro.visibilityDesc"),
    },
  ];

  return (
    <ScreenWrapper
      scroll={true}
      style={{ backgroundColor: "#f2f2f3" }}
      contentStyle={styles.content}
    >
      {/* Premium Header Image Card */}
      <View style={styles.imageCardContainer}>
        <ImageBackground
          source={chefImage}
          style={styles.headerImage}
          resizeMode="cover"
        >
          <View style={styles.imageOverlay}>
            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>{t("chefIntro.badge") || "CHEF CONNECT"}</Text>
            </View>
            <Text style={styles.headerTitle}>{t("chefIntro.mainTitle")}</Text>
          </View>
        </ImageBackground>
      </View>

      {/* Grid: Side-by-Side Statistics/Highlights */}
      <View style={styles.statsContainer}>
        <View style={styles.greenCard}>
          <Ionicons name="restaurant" size={24} color="#153e69" />
          <Text style={styles.greenCardText}>{t("chefIntro.verifiedChefs")}</Text>
        </View>
        <View style={styles.greyCard}>
          <Ionicons name="globe-outline" size={24} color="#0a0504" />
          <Text style={styles.greyCardText}>{t("chefIntro.countries")}</Text>
        </View>
      </View>

      {/* Elevate Your Career Section */}
      <Text style={styles.sectionTitle}>{t("chefIntro.sectionTitle")}</Text>

      {/* Benefit Cards List */}
      <View style={styles.benefitsList}>
        {benefits.map((item) => (
          <View key={item.key} style={styles.benefitCard}>
            <View style={[styles.iconContainer, { backgroundColor: item.bgColor }]}>
              <Ionicons name={item.icon} size={22} color={item.iconColor} />
            </View>
            <View style={styles.benefitTextContainer}>
              <Text style={styles.benefitTitle}>{item.title}</Text>
              <Text style={styles.benefitDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Action Button */}
      <Pressable onPress={handleNext} style={styles.button}>
        <Text style={styles.buttonText}>{t("chefIntro.button")}</Text>
      </Pressable>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 24,
    backgroundColor: "#f2f2f3",
  },
  imageCardContainer: {
    borderRadius: 24,
    overflow: "hidden",
    height: 220,
    backgroundColor: "#0a0504",
    shadowColor: "#0a0504",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  headerImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    flex: 1,
    backgroundColor: "rgba(10, 5, 4, 0.45)",
    padding: 20,
    justifyContent: "flex-end",
  },
  pillBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#153e69",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10,
  },
  pillBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#f2f2f3",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#f2f2f3",
    lineHeight: 28,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 18,
  },
  greenCard: {
    flex: 1,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    borderRadius: 16,
    padding: 16,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(21, 62, 105, 0.18)",
  },
  greenCardText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#153e69",
    marginTop: 12,
    lineHeight: 18,
  },
  greyCard: {
    flex: 1,
    backgroundColor: "rgba(10, 5, 4, 0.04)",
    borderRadius: 16,
    padding: 16,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.1)",
  },
  greyCardText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0a0504",
    marginTop: 12,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 14,
  },
  benefitsList: {
    marginBottom: 16,
  },
  benefitCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f3",
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.1)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#0a0504",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  benefitTextContainer: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 3,
  },
  benefitDesc: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    lineHeight: 16,
  },
  button: {
    backgroundColor: "#153e69",
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 16,
    shadowColor: "#153e69",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
});
