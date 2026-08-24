import React from "react";
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View, Dimensions, PixelRatio } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import colors from "../../constants/colors";
import chefImage from "../../assets/chef.png";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

export default function ChefIntroductionScreen({ navigation }) {
  const { t } = useTranslation();

  const handleNext = () => {
    navigation.navigate("Login");
  };

  const benefits = [
    {
      num: "01",
      icon: "trending-up-outline",
      iconColor: "#2563eb",
      bgColor: "#eff6ff",
      numBg: "#f1f5f9",
      numColor: "#1e40af",
      title: t("chefIntro.consultingTitle", "Consulting Opportunities"),
      desc: t("chefIntro.consultingDesc", "Share your culinary expertise with top brands and hospitality businesses globally."),
    },
    {
      num: "02",
      icon: "business-outline",
      iconColor: "#ea580c",
      bgColor: "#fff7ed",
      numBg: "#fff7ed",
      numColor: "#c2410c",
      title: t("chefIntro.projectsTitle", "Hospitality Projects"),
      desc: t("chefIntro.projectsDesc", "Get selected for luxury resort, hotel openings and premium F&B projects."),
    },
    {
      num: "03",
      icon: "people-outline",
      iconColor: "#059669",
      bgColor: "#ecfdf5",
      numBg: "#e6fffa",
      numColor: "#047857",
      title: t("chefIntro.networkingTitle", "Business Networking"),
      desc: t("chefIntro.networkingDesc", "Connect with industry leaders, investors and like-minded culinary professionals."),
    },
    {
      num: "04",
      icon: "ribbon-outline",
      iconColor: "#9333ea",
      bgColor: "#faf5ff",
      numBg: "#f3e8ff",
      numColor: "#7e22ce",
      title: t("chefIntro.visibilityTitle", "Professional Visibility"),
      desc: t("chefIntro.visibilityDesc", "Showcase your profile, portfolio and achievements to elite recruiters."),
    },
  ];

  return (
    <ScreenWrapper
      scroll={true}
      style={{ backgroundColor: "#fafafa" }}
      contentStyle={styles.content}
    >
      {/* Top Header Row */}
      <View style={styles.topHeaderRow}>
        <Image
          source={require("../../assets/Jobrito Wordmark with Tagline.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <View style={styles.badgeWrapper}>
          <View style={styles.badgeLeft}>
            <Ionicons name="restaurant-outline" size={normalize(12)} color="#153e69" style={{ marginRight: normalize(3) }} />
            <Text style={styles.badgeLeftText}>{t("chefIntro.badge", "CHEF CONNECT")}</Text>
          </View>
          <View style={styles.badgeRight}>
            <Text style={styles.badgeRightText}>{t("chefIntro.premium", "PREMIUM")}</Text>
          </View>
        </View>
      </View>

      {/* Hero Section */}
      <View style={styles.heroCardContainer}>
        <View style={styles.heroTextCol}>
          <Text style={styles.heroSubHeader}>{t("chefIntro.joinExclusive", "Join an Exclusive")}</Text>
          <Text style={styles.heroMainTitle}>{t("chefIntro.chefNetwork", "Chef Network")}</Text>
          <Text style={styles.heroOrangeTagline}>{t("chefIntro.heroTagline", "Connect. Collaborate. Create Excellence.")}</Text>
          <Text style={styles.heroDescription}>
            {t("chefIntro.heroDesc", "JobRito Chef Connect is a premium platform for culinary professionals and hospitality consultants across the globe.")}
          </Text>
        </View>

        <View style={styles.heroImageWrapper}>
          <Image source={chefImage} style={styles.heroChefImage} resizeMode="cover" />
        </View>
      </View>

      {/* Premium Module Box (Positioned right below Hero Card) */}
     

      {/* Section Divider & Header */}
      <View style={styles.sectionHeaderBox}>
        <Text style={styles.dotsTitle}>— • {t("chefIntro.premiumBenefits", "PREMIUM BENEFITS")} • —</Text>
        <Text style={styles.sectionMainTitle}>{t("chefIntro.whyJoinTitle", "Why Join Chef Connect?")}</Text>
      </View>

      {/* Benefits 4 Cards Horizontal Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.benefitsScrollContent}
      >
        {benefits.map((item) => (
          <View key={item.num} style={styles.benefitCardItem}>
            <View style={[styles.benefitIconCircle, { backgroundColor: item.bgColor }]}>
              <Ionicons name={item.icon} size={normalize(22)} color={item.iconColor} />
            </View>

            <View style={[styles.numberBadgeCircle, { backgroundColor: item.numBg }]}>
              <Text style={[styles.numberBadgeText, { color: item.numColor }]}>{item.num}</Text>
            </View>
            <Text style={styles.benefitCardTitle}>{item.title}</Text>
            <Text style={styles.benefitCardDesc}>{item.desc}</Text>
          </View>
        ))}
      </ScrollView>
 <View style={styles.premiumModuleCard}>
        <View style={styles.crownCircle}>
          <Ionicons name="sparkles" size={normalize(18)} color="#d97706" />
        </View>

        <View style={{ flex: 1, paddingHorizontal: normalize(8) }}>
          <Text style={styles.premiumModuleTitle}>{t("chefIntro.premiumModuleTitle", "This is a Premium Module")}</Text>
          <Text style={styles.premiumModuleSub}>
            {t("chefIntro.premiumModuleSub", "Access is by invitation or approval only to ensure quality and exclusivity.")}
          </Text>
        </View>

        <Ionicons name="shield-checkmark-outline" size={normalize(24)} color="#f59e0b" />
      </View>

      {/* Action Button */}
      <Pressable onPress={handleNext} style={styles.button} activeOpacity={0.85}>
        <Text style={styles.buttonText}>{t("chefIntro.button", "Become a Culinary Talent →")}</Text>
        <Ionicons name="arrow-forward" size={normalize(16)} color="#ffffff" style={{ marginLeft: normalize(6) }} />
      </Pressable>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: normalize(12),
    paddingBottom: normalize(24),
    backgroundColor: "#fafafa",
  },

  // Top Header Row
  topHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: normalize(12),
    marginTop: normalize(4),
  },
  logoImage: {
    width: normalize(105),
    height: normalize(68),
  },
  badgeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: normalize(16),
    paddingLeft: normalize(8),
    paddingRight: normalize(3),
    paddingVertical: normalize(2),
  },
  badgeLeft: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: normalize(4),
  },
  badgeLeftText: {
    fontSize: normalize(9.5),
    fontWeight: "800",
    color: "#153e69",
    letterSpacing: 0.4,
  },
  badgeRight: {
    backgroundColor: "#f59e0b",
    paddingHorizontal: normalize(6),
    paddingVertical: normalize(2),
    borderRadius: normalize(12),
  },
  badgeRightText: {
    fontSize: normalize(8.5),
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 0.5,
  },

  // Hero Section
  heroCardContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: normalize(10),
    padding: normalize(10),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1.5,
    marginBottom: normalize(10),
  },
  heroTextCol: {
    flex: 1,
    paddingRight: normalize(8),
  },
  heroSubHeader: {
    fontSize: normalize(13.5),
    fontWeight: "700",
    color: "#1e293b",
  },
  heroMainTitle: {
    fontSize: normalize(22),
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -0.5,
    marginBottom: normalize(2),
  },
  heroOrangeTagline: {
    fontSize: normalize(11.5),
    fontWeight: "800",
    color: "#ea580c",
    marginBottom: normalize(4),
  },
  heroDescription: {
    fontSize: normalize(10.5),
    color: "#64748b",
    lineHeight: normalize(14.5),
  },
  heroImageWrapper: {
    width: normalize(110),
    height: normalize(125),
    borderRadius: normalize(10),
    overflow: "hidden",
  },
  heroChefImage: {
    width: "100%",
    height: "100%",
  },

  // Section Header Box
  sectionHeaderBox: {
    alignItems: "center",
    marginBottom: normalize(8),
  },
  dotsTitle: {
    fontSize: normalize(10),
    fontWeight: "800",
    color: "#ea580c",
    letterSpacing: 1.2,
    marginBottom: normalize(2),
  },
  sectionMainTitle: {
    fontSize: normalize(18),
    fontWeight: "900",
    color: "#0f172a",
  },

  // Benefits Scroll Content
  benefitsScrollContent: {
    paddingVertical: normalize(2),
    gap: normalize(8),
    marginBottom: normalize(4),
    alignItems: "flex-start",
  },
  benefitCardItem: {
    width: normalize(140),
    height: normalize(205),
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: normalize(10),
    padding: normalize(10),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  benefitIconCircle: {
    width: normalize(38),
    height: normalize(38),
    borderRadius: normalize(19),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: normalize(4),
  },
  numberBadgeCircle: {
    width: normalize(20),
    height: normalize(20),
    borderRadius: normalize(10),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: normalize(6),
  },
  numberBadgeText: {
    fontSize: normalize(9.5),
    fontWeight: "800",
  },
  benefitCardTitle: {
    fontSize: normalize(11.5),
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: normalize(2),
    lineHeight: normalize(14.5),
    height: normalize(29),
  },
  benefitCardDesc: {
    fontSize: normalize(9.5),
    color: "#64748b",
    textAlign: "center",
    lineHeight: normalize(13),
    flex: 1,
  },

  // Premium Module Box
  premiumModuleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: normalize(10),
    padding: normalize(10),
    marginTop: normalize(4),
    marginBottom: normalize(12),
  },
  crownCircle: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    backgroundColor: "#fef3c7",
    alignItems: "center",
    justifyContent: "center",
  },
  premiumModuleTitle: {
    fontSize: normalize(12),
    fontWeight: "800",
    color: "#78350f",
    marginBottom: normalize(1),
  },
  premiumModuleSub: {
    fontSize: normalize(10),
    color: "#92400e",
    lineHeight: normalize(13.5),
  },

  // Action Button
  button: {
    backgroundColor: "#153e69",
    height: normalize(46),
    borderRadius: normalize(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: normalize(14),
    shadowColor: "#153e69",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: normalize(14.5),
    fontWeight: "800",
  },
});
