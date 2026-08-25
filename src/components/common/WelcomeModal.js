import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  PixelRatio,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

const PRIMARY_PURPLE = "#5B4FE5";
const LIGHT_PURPLE_BG = "#F3F0FF";
const DARK_NAVY = "#1E1B3A";
const TEXT_GRAY = "#6B7280";
const TAG_GREEN_BG = "#D1FAE5";
const TAG_GREEN_TEXT = "#10B981";
const TAG_BLUE_BG = "#DBEAFE";
const TAG_BLUE_TEXT = "#3B82F6";
const TAG_ORANGE_BG = "#FEF3C7";
const TAG_ORANGE_TEXT = "#F59E0B";

// Helper function to build AsyncStorage key
export const getWelcomeStorageKey = (userId = "guest", role = "talent") => {
  return `@jobconnect/welcome_modal_seen_${userId}_${role}`;
};

// Helper function to mark modal as seen
export const markWelcomeModalSeen = async (userId = "guest", role = "talent") => {
  try {
    const key = getWelcomeStorageKey(userId, role);
    await AsyncStorage.setItem(key, "true");
  } catch (error) {
    console.warn("Error marking welcome modal as seen:", error);
  }
};

// Helper function to check if modal has been seen
export const hasWelcomeModalBeenSeen = async (userId = "guest", role = "talent") => {
  try {
    const key = getWelcomeStorageKey(userId, role);
    const val = await AsyncStorage.getItem(key);
    return val === "true";
  } catch (error) {
    console.warn("Error checking welcome modal seen status:", error);
    return false;
  }
};

export default function WelcomeModal({
  visible = false,
  role = "talent",
  userId = "guest",
  onClose,
  onExplore,
}) {
  const { t } = useTranslation();
  const isChef = role === "chef";

  const handleDismiss = async () => {
    await markWelcomeModalSeen(userId, role);
    if (onClose) onClose();
  };

  const handleExplore = async () => {
    await markWelcomeModalSeen(userId, role);
    if (onClose) onClose();
    if (onExplore) onExplore();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        handleDismiss();
      }}
    >
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalCardContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
            bounces={false}
          >
            {/* Top Illustration Section */}
            <View style={styles.illustrationSection}>
              {/* Background Cloud Circle */}
              <View style={styles.cloudBgShape} />

              {/* Decorative Stars / Sparkles */}
              <Ionicons
                name="sparkles"
                size={normalize(14)}
                color="#c084fc"
                style={styles.sparkleIconLeft}
              />
              <Ionicons
                name="star"
                size={normalize(10)}
                color="#a855f7"
                style={styles.starIconRight}
              />
              <Ionicons
                name="sparkles-outline"
                size={normalize(12)}
                color="#818cf8"
                style={styles.sparkleIconBottom}
              />

              {/* Paper Plane & Arc */}
              <View style={styles.paperPlaneWrap}>
                <Ionicons
                  name="paper-plane"
                  size={normalize(22)}
                  color="#818cf8"
                />
              </View>

              {/* Floating Circular Briefcase Badge */}
              <View style={styles.floatingBriefcaseBadge}>
                <Ionicons
                  name="briefcase"
                  size={normalize(24)}
                  color="#ffffff"
                />
              </View>

              {/* Mockup Phone Frame */}
              <View style={styles.phoneFrame}>
                {/* Phone Notch */}
                <View style={styles.phoneNotch} />

                {/* Card 1: Sous Chef */}
                <View style={styles.mockupCard}>
                  <View style={styles.mockupCardHeader}>
                    <Text style={styles.mockupCardTitle} numberOfLines={1}>
                      {isChef ? "Head Chef" : "Sous Chef"}
                    </Text>
                    <Ionicons
                      name="bookmark-outline"
                      size={normalize(12)}
                      color="#64748b"
                    />
                  </View>
                  <Text style={styles.mockupCardSub} numberOfLines={1}>
                    Urban Café
                  </Text>
                  <View style={styles.mockupCardLocRow}>
                    <Ionicons
                      name="location-outline"
                      size={normalize(10)}
                      color="#64748b"
                      style={{ marginRight: 2 }}
                    />
                    <Text style={styles.mockupCardLocText} numberOfLines={1}>
                      Riyadh, Saudi Arabia
                    </Text>
                  </View>
                  <View style={[styles.jobTypeTag, { backgroundColor: TAG_GREEN_BG }]}>
                    <Text style={[styles.jobTypeTagText, { color: TAG_GREEN_TEXT }]}>
                      Full Time
                    </Text>
                  </View>
                </View>

                {/* Card 2: Barista */}
                <View style={styles.mockupCard}>
                  <View style={styles.mockupCardHeader}>
                    <Text style={styles.mockupCardTitle} numberOfLines={1}>
                      {isChef ? "Pastry Chef" : "Barista"}
                    </Text>
                    <Ionicons
                      name="bookmark-outline"
                      size={normalize(12)}
                      color="#64748b"
                    />
                  </View>
                  <Text style={styles.mockupCardSub} numberOfLines={1}>
                    Brew & Bite Café
                  </Text>
                  <View style={styles.mockupCardLocRow}>
                    <Ionicons
                      name="location-outline"
                      size={normalize(10)}
                      color="#64748b"
                      style={{ marginRight: 2 }}
                    />
                    <Text style={styles.mockupCardLocText} numberOfLines={1}>
                      Jeddah, Saudi Arabia
                    </Text>
                  </View>
                  <View style={[styles.jobTypeTag, { backgroundColor: TAG_BLUE_BG }]}>
                    <Text style={[styles.jobTypeTagText, { color: TAG_BLUE_TEXT }]}>
                      Part Time
                    </Text>
                  </View>
                </View>

                {/* Card 3: Kitchen Helper */}
                <View style={styles.mockupCard}>
                  <View style={styles.mockupCardHeader}>
                    <Text style={styles.mockupCardTitle} numberOfLines={1}>
                      {isChef ? "Line Cook" : "Kitchen Helper"}
                    </Text>
                    <Ionicons
                      name="bookmark-outline"
                      size={normalize(12)}
                      color="#64748b"
                    />
                  </View>
                  <Text style={styles.mockupCardSub} numberOfLines={1}>
                    Tasty Bites Kitchen
                  </Text>
                  <View style={styles.mockupCardLocRow}>
                    <Ionicons
                      name="location-outline"
                      size={normalize(10)}
                      color="#64748b"
                      style={{ marginRight: 2 }}
                    />
                    <Text style={styles.mockupCardLocText} numberOfLines={1}>
                      Dammam, Saudi Arabia
                    </Text>
                  </View>
                  <View style={[styles.jobTypeTag, { backgroundColor: TAG_ORANGE_BG }]}>
                    <Text style={[styles.jobTypeTagText, { color: TAG_ORANGE_TEXT }]}>
                      Contract
                    </Text>
                  </View>
                </View>
              </View>

              {/* Plant / Leaf Graphics Bottom Left & Right */}
              <View style={styles.plantLeft}>
                <Ionicons name="leaf-outline" size={normalize(24)} color="#c084fc" />
              </View>
              <View style={styles.plantRight}>
                <Ionicons name="leaf-outline" size={normalize(24)} color="#a855f7" />
              </View>
            </View>

            {/* Text Content Section */}
            <View style={styles.textContentSection}>
              {/* Main Heading */}
              <Text style={styles.headingTitle}>
                {t("welcomeTo", "Welcome to")}{" "}
                <Text style={styles.headingBrand}>jobrito</Text>
              </Text>

              <Text style={styles.headingFeedText}>
                {isChef
                  ? t("chefOpportunities", "Chef Opportunities")
                  : t("jobFeedTitle", "Job Feed")}
              </Text>

              {/* Purple Accent Divider Line */}
              <View style={styles.purpleAccentLine} />

              {/* Subheading */}
              <Text style={styles.subheadingText}>
                {t("thankYouForJoiningUs", "Thank you for joining us!")}
              </Text>

              {/* Body Paragraph */}
              <Text style={styles.bodyText}>
                {t(
                  "welcomeBodyCommunity",
                  "You're now part of a growing community of talent and opportunities."
                )}
              </Text>

              {/* 3-Column Feature Icons Row */}
              <View style={styles.featureRow}>
                {/* Feature 1 */}
                <View style={styles.featureCol}>
                  <View style={styles.featureBadgeCircle}>
                    <Ionicons name="search" size={normalize(18)} color={PRIMARY_PURPLE} />
                  </View>
                  <Text style={styles.featureColTitle}>
                    {t("discoverJobs", "Discover jobs")}
                  </Text>
                  <Text style={styles.featureColSub}>
                    {t("thatFitYou", "that fit you")}
                  </Text>
                </View>

                {/* Feature 2 */}
                <View style={styles.featureCol}>
                  <View style={styles.featureBadgeCircle}>
                    <Ionicons name="bookmark" size={normalize(18)} color={PRIMARY_PURPLE} />
                  </View>
                  <Text style={styles.featureColTitle}>
                    {t("saveAndShare", "Save & share")}
                  </Text>
                  <Text style={styles.featureColSub}>
                    {t("opportunities", "opportunities")}
                  </Text>
                </View>

                {/* Feature 3 */}
                <View style={styles.featureCol}>
                  <View style={styles.featureBadgeCircle}>
                    <Ionicons name="notifications" size={normalize(18)} color={PRIMARY_PURPLE} />
                  </View>
                  <Text style={styles.featureColTitle}>
                    {t("getNotified", "Get notified")}
                  </Text>
                  <Text style={styles.featureColSub}>
                    {t("aboutNewJobs", "about new jobs")}
                  </Text>
                </View>
              </View>

              {/* Closing Lines */}
              <View style={styles.closingWrap}>
                <Text style={styles.closingLine1}>
                  {t("excitedToHaveYou", "We're excited to have you on board.")}
                </Text>
                <Text style={styles.closingLine2}>
                  {t("goodLuck", "Good luck!")} 🎉
                </Text>
              </View>

              {/* Primary Purple CTA Button */}
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={handleExplore}
                activeOpacity={0.85}
              >
                <Text style={styles.ctaButtonText}>
                  {isChef
                    ? t("exploreChefOpportunities", "Explore Chef Opportunities")
                    : t("exploreJobFeed", "Explore Job Feed")}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCardContainer: {
    width: SCREEN_WIDTH * 0.88,
    maxHeight: SCREEN_HEIGHT * 0.88,
    backgroundColor: "#ffffff",
    borderRadius: normalize(24),
    position: "relative",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    overflow: "visible",
  },
  closeBtnCircle: {
    position: "absolute",
    top: normalize(-12),
    right: normalize(-10),
    zIndex: 99,
    width: normalize(34),
    height: normalize(34),
    borderRadius: normalize(17),
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  scrollContainer: {
    flexGrow: 1,
    borderRadius: normalize(24),
    overflow: "hidden",
  },

  // Illustration Section
  illustrationSection: {
    backgroundColor: LIGHT_PURPLE_BG,
    paddingTop: normalize(24),
    paddingBottom: normalize(16),
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderTopLeftRadius: normalize(24),
    borderTopRightRadius: normalize(24),
    overflow: "hidden",
  },
  cloudBgShape: {
    position: "absolute",
    width: normalize(260),
    height: normalize(260),
    borderRadius: normalize(130),
    backgroundColor: "#f5f3ff",
    opacity: 0.8,
    top: normalize(10),
  },

  // Decorative Elements
  sparkleIconLeft: {
    position: "absolute",
    top: normalize(20),
    left: normalize(24),
    opacity: 0.7,
  },
  starIconRight: {
    position: "absolute",
    top: normalize(70),
    right: normalize(20),
    opacity: 0.6,
  },
  sparkleIconBottom: {
    position: "absolute",
    bottom: normalize(25),
    left: normalize(35),
    opacity: 0.6,
  },
  paperPlaneWrap: {
    position: "absolute",
    top: normalize(18),
    right: normalize(32),
    transform: [{ rotate: "-15deg" }],
  },

  // Briefcase Floating Circle
  floatingBriefcaseBadge: {
    position: "absolute",
    top: normalize(22),
    left: normalize(75),
    zIndex: 10,
    width: normalize(52),
    height: normalize(52),
    borderRadius: normalize(26),
    backgroundColor: PRIMARY_PURPLE,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PRIMARY_PURPLE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },

  // Mockup Phone Frame
  phoneFrame: {
    width: normalize(190),
    backgroundColor: "#ffffff",
    borderRadius: normalize(20),
    borderWidth: 3,
    borderColor: "#1e1b4b",
    paddingHorizontal: normalize(8),
    paddingTop: normalize(14),
    paddingBottom: normalize(10),
    gap: normalize(6),
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  phoneNotch: {
    alignSelf: "center",
    width: normalize(44),
    height: normalize(4),
    borderRadius: normalize(2),
    backgroundColor: "#1e1b4b",
    marginBottom: normalize(4),
  },
  mockupCard: {
    backgroundColor: "#ffffff",
    borderRadius: normalize(8),
    borderWidth: 1,
    borderColor: "#f1f5f9",
    padding: normalize(6),
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  mockupCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mockupCardTitle: {
    fontSize: normalize(10.5),
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
  },
  mockupCardSub: {
    fontSize: normalize(8.5),
    color: "#64748b",
    marginTop: 1,
  },
  mockupCardLocRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  mockupCardLocText: {
    fontSize: normalize(8),
    color: "#94a3b8",
  },
  jobTypeTag: {
    alignSelf: "flex-start",
    marginTop: 4,
    borderRadius: normalize(4),
    paddingHorizontal: normalize(6),
    paddingVertical: 2,
  },
  jobTypeTagText: {
    fontSize: normalize(7.5),
    fontWeight: "700",
  },

  // Plants
  plantLeft: {
    position: "absolute",
    bottom: normalize(6),
    left: normalize(12),
    opacity: 0.8,
  },
  plantRight: {
    position: "absolute",
    bottom: normalize(6),
    right: normalize(12),
    opacity: 0.8,
  },

  // Text Section
  textContentSection: {
    backgroundColor: "#ffffff",
    paddingHorizontal: normalize(18),
    paddingTop: normalize(16),
    paddingBottom: normalize(20),
    alignItems: "center",
  },
  headingTitle: {
    fontSize: normalize(22),
    fontWeight: "800",
    color: DARK_NAVY,
    textAlign: "center",
  },
  headingBrand: {
    color: PRIMARY_PURPLE,
    fontWeight: "800",
  },
  headingFeedText: {
    fontSize: normalize(22),
    fontWeight: "800",
    color: PRIMARY_PURPLE,
    textAlign: "center",
    marginTop: normalize(2),
  },
  purpleAccentLine: {
    width: normalize(28),
    height: normalize(3),
    borderRadius: normalize(2),
    backgroundColor: PRIMARY_PURPLE,
    marginVertical: normalize(10),
  },
  subheadingText: {
    fontSize: normalize(15),
    fontWeight: "700",
    color: PRIMARY_PURPLE,
    textAlign: "center",
    marginBottom: normalize(4),
  },
  bodyText: {
    fontSize: normalize(12),
    color: TEXT_GRAY,
    textAlign: "center",
    lineHeight: normalize(16),
    paddingHorizontal: normalize(6),
    marginBottom: normalize(16),
  },

  // 3 Features Row
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: normalize(16),
    paddingHorizontal: normalize(4),
  },
  featureCol: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: normalize(2),
  },
  featureBadgeCircle: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(22),
    backgroundColor: LIGHT_PURPLE_BG,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: normalize(6),
  },
  featureColTitle: {
    fontSize: normalize(10.5),
    fontWeight: "700",
    color: DARK_NAVY,
    textAlign: "center",
  },
  featureColSub: {
    fontSize: normalize(9.5),
    color: TEXT_GRAY,
    textAlign: "center",
    marginTop: 1,
  },

  // Closing Wrap
  closingWrap: {
    alignItems: "center",
    marginBottom: normalize(18),
  },
  closingLine1: {
    fontSize: normalize(11.5),
    color: TEXT_GRAY,
    textAlign: "center",
  },
  closingLine2: {
    fontSize: normalize(13.5),
    fontWeight: "800",
    color: PRIMARY_PURPLE,
    textAlign: "center",
    marginTop: 2,
  },

  // CTA Button
  ctaButton: {
    width: "100%",
    backgroundColor: PRIMARY_PURPLE,
    borderRadius: normalize(14),
    paddingVertical: normalize(13),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PRIMARY_PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  ctaButtonText: {
    fontSize: normalize(14),
    fontWeight: "800",
    color: "#ffffff",
  },
});
